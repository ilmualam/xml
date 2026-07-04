// xml-lint.js
// Usable as an importable module or directly executable CLI script.

'use strict';

const fs = require('fs');
const xmldom = require('@xmldom/xmldom');
const xpath = require('xpath');

// Blogger namespace URI declared in the template root element.
const BLOGGER_NS = 'http://www.google.com/2005/gml/b';

// Namespace-aware selector using the Blogger prefix.
const bSelect = xpath.useNamespaces({ b: BLOGGER_NS });

// Pattern that identifies Blogger template expressions inside text content.
// These prevent normal JSON parsing and must be treated as warnings, not errors.
const BLOGGER_EXPR_RE = /\bdata:[a-zA-Z]|<b:|expr:/;

/**
 * Parse an XML string and return an object with the DOM document and any
 * parse errors/warnings collected during parsing.
 *
 * @param {string} xmlString
 * @returns {{ doc: Document|null, errors: string[], warnings: string[] }}
 */
function parseXML(xmlString) {
    const errors = [];
    const warnings = [];

    // Strip UTF-8 BOM (U+FEFF) if present — @xmldom/xmldom 0.9.x rejects it.
    const src = xmlString.charCodeAt(0) === 0xFEFF ? xmlString.slice(1) : xmlString;

    const parser = new xmldom.DOMParser({
        onError: (level, msg) => {
            if (level === 'warning') {
                warnings.push(msg);
            } else {
                // 'error' and 'fatalError' are both fatal for our purposes
                errors.push(msg);
            }
        },
    });

    let doc = null;
    try {
        doc = parser.parseFromString(src, 'text/xml');
    } catch (e) {
        // @xmldom/xmldom throws ParseError for fatal parse errors
        errors.push(e.message || String(e));
    }
    return { doc, errors, warnings };
}

/**
 * Return the names of meta tags whose `name` attribute appears more than once.
 * Only static (non-expression) values are considered.
 *
 * @param {Element[]} metaTags
 * @returns {string[]}
 */
function findDuplicateMetaNames(metaTags) {
    const seen = {};
    const duplicates = [];
    for (const tag of metaTags) {
        const name = tag.getAttribute('name');
        // Skip values that contain Blogger expressions.
        if (!name || BLOGGER_EXPR_RE.test(name)) continue;
        if (seen[name]) {
            if (!duplicates.includes(name)) duplicates.push(name);
        } else {
            seen[name] = true;
        }
    }
    return duplicates;
}

/**
 * Return `b:if` elements that are missing the required `cond` attribute.
 *
 * @param {Element[]} ifTags
 * @returns {Element[]}
 */
function findIfsMissingCond(ifTags) {
    return ifTags.filter((tag) => {
        const cond = tag.getAttribute('cond');
        return !cond || cond.trim() === '';
    });
}

/**
 * Return HTML `id` attribute values that appear on more than one element.
 * Only static (non-expression) id values are considered.
 *
 * @param {Element[]} elements
 * @returns {string[]}
 */
function findDuplicateIds(elements) {
    const seen = {};
    const duplicates = [];
    for (const el of elements) {
        const id = el.getAttribute('id');
        if (!id || BLOGGER_EXPR_RE.test(id)) continue;
        if (seen[id]) {
            if (!duplicates.includes(id)) duplicates.push(id);
        } else {
            seen[id] = true;
        }
    }
    return duplicates;
}

/**
 * Decode the five predefined XML entities so that textContent extracted by
 * xmldom can be parsed as JSON.  xmldom 0.6.x preserves entity references
 * in text nodes rather than decoding them.
 *
 * @param {string} str
 * @returns {string}
 */
function decodeXmlEntities(str) {
    return str
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');  // must be last to avoid double-decoding
}

/**
 * Return true if the given DOM element contains any child element nodes
 * (i.e., non-text children).  Blogger template expressions such as
 * `<data:post.title/>` and `<b:eval expr='...'/>` are sometimes parsed by
 * xmldom as child elements, so their presence indicates dynamic content.
 *
 * Note: xmldom 0.6.x treats `<script>` content as raw text (HTML-style), so
 * child-element detection is a secondary signal; textContent scanning below
 * is the primary detection path for script blocks.
 *
 * @param {Element} el
 * @returns {boolean}
 */
function hasChildElements(el) {
    for (let i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 1 /* ELEMENT_NODE */) return true;
    }
    return false;
}

// Pattern that identifies Blogger template expressions in raw text content.
// xmldom 0.6.x stores <data:…/> and <b:…/> markup literally inside script
// text nodes rather than parsing them as child elements.
const BLOGGER_TEXT_RE = /<data:|<b:|expr:/;

/**
 * Validate JSON-LD script blocks.
 * - Blocks containing Blogger expressions (detected via child elements or
 *   textContent patterns) are reported as skipped warnings.
 * - Blocks with no expressions are parsed after XML entity decoding;
 *   parse failures are errors.
 *
 * @param {Element[]} scripts
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateJsonLd(scripts) {
    const errors = [];
    const warnings = [];
    scripts.forEach((script, idx) => {
        // Primary: check raw text content for Blogger expression markup.
        // xmldom 0.6.x stores <data:…/> and <b:eval …/> as literal text inside
        // script elements rather than parsing them as child elements.
        const rawSrc = (script.textContent || '').trim();
        if (!rawSrc) return;

        if (hasChildElements(script) || BLOGGER_TEXT_RE.test(rawSrc)) {
            warnings.push(
                `JSON-LD block #${idx + 1} contains Blogger template expressions — skipped (not parseable as static JSON)`
            );
            return;
        }

        // Decode XML entities before JSON parsing (xmldom preserves &quot; etc.).
        const src = decodeXmlEntities(rawSrc);
        try {
            JSON.parse(src);
        } catch (e) {
            errors.push(`JSON-LD block #${idx + 1} is invalid JSON: ${e.message}`);
        }
    });
    return { errors, warnings };
}

/**
 * Run all validation checks against a parsed XML document.
 * Returns an object with `errors` (fatal) and `warnings` (non-fatal) arrays.
 *
 * @param {string} xmlString  Raw XML content.
 * @returns {{ errors: string[], warnings: string[] }}
 */
function lintXML(xmlString) {
    const errors = [];
    const warnings = [];

    // 1. Parse XML and collect parse-level errors.
    const { doc, errors: parseErrors, warnings: parseWarnings } = parseXML(xmlString);

    if (parseErrors.length) {
        errors.push(...parseErrors.map((e) => `XML parse error: ${e}`));
    }
    if (parseWarnings.length) {
        warnings.push(...parseWarnings.map((w) => `XML parse warning: ${w}`));
    }

    if (!doc) {
        errors.push('XML document could not be parsed.');
        return { errors, warnings };
    }

    // 2. Confirm the Blogger namespace is declared.
    const rootNS = doc.documentElement && doc.documentElement.getAttribute('xmlns:b');
    if (rootNS !== BLOGGER_NS) {
        errors.push(
            `Missing or incorrect Blogger namespace. Expected xmlns:b="${BLOGGER_NS}", found: ${rootNS || '(none)'}`
        );
    }

    // 3. Check b:if elements for required `cond` attribute.
    const ifTags = bSelect('//b:if', doc);
    const missingCond = findIfsMissingCond(ifTags);
    if (missingCond.length) {
        errors.push(
            `${missingCond.length} <b:if> element(s) are missing the required "cond" attribute.`
        );
    }

    // 4. Duplicate static HTML id attributes.
    // In Blogger templates, the same id can appear in multiple b:defaultmarkup
    // sections (widget template definitions); only one renders per page.
    // Detection is therefore reported as a warning, not a hard error.
    const allWithId = xpath.select('//*[@id]', doc);
    const dupIds = findDuplicateIds(allWithId);
    if (dupIds.length) {
        warnings.push(`Duplicate static HTML id(s) detected: ${dupIds.join(', ')}`);
    }

    // 5. Duplicate static meta name attributes.
    const metaTags = xpath.select("//*[local-name()='meta']", doc);
    const dupMeta = findDuplicateMetaNames(metaTags);
    if (dupMeta.length) {
        warnings.push(`Duplicate meta name(s) detected: ${dupMeta.join(', ')}`);
    }

    // 6. JSON-LD validation.
    const jsonLdScripts = xpath.select("//*[local-name()='script'][@type='application/ld+json']", doc);
    const jsonLdResult = validateJsonLd(jsonLdScripts);
    errors.push(...jsonLdResult.errors);
    warnings.push(...jsonLdResult.warnings);

    return { errors, warnings };
}

/**
 * CLI entry point — run when the script is executed directly.
 */
function main() {
    const filePath = process.argv[2] || 'asset/xml/ilmualam.xml';

    // Confirm file exists and is readable.
    if (!fs.existsSync(filePath)) {
        console.error(`\u274C File not found: ${filePath}`);
        process.exit(1);
    }

    let xmlString;
    try {
        xmlString = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error(`\u274C Cannot read file: ${filePath}\n${err.message}`);
        process.exit(1);
    }

    console.log(`\nValidating: ${filePath}`);
    console.log('─'.repeat(60));

    const { errors, warnings } = lintXML(xmlString);

    if (warnings.length) {
        console.log(`\nWarnings (${warnings.length}):`);
        warnings.forEach((w) => console.log(`  ⚠  ${w}`));
    }

    if (errors.length) {
        console.log(`\nErrors (${errors.length}):`);
        errors.forEach((e) => console.log(`  ✖  ${e}`));
        console.log('\n✖ Validation FAILED\n');
        process.exit(1);
    }

    console.log(warnings.length ? '' : '\n');
    console.log(`✔ Validation PASSED${warnings.length ? ` (${warnings.length} warning(s))` : ''}\n`);
    process.exit(0);
}

module.exports = { lintXML, parseXML };

// Run CLI when executed directly.
if (require.main === module) {
    main();
}