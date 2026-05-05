// xml-lint.js

const fs = require('fs');
const xmldom = require('xmldom');
const xpath = require('xpath');

function lintXML(xmlString) {
    const doc = new xmldom.DOMParser().parseFromString(xmlString);
    const metaTags = xpath.select("//meta", doc);
    const ifTags = xpath.select("//b:if", doc);
    const jsonLdScripts = xpath.select("//script[@type='application/ld+json']", doc);

    // Check for duplicate meta tags
    const metaDuplicates = findDuplicateMetaTags(metaTags);
    if (metaDuplicates.length) {
        console.warn('Duplicate meta tags found:', metaDuplicates);
    }

    // Check for unmatched b:if conditions
    const unmatchedIfs = findUnmatchedIfConditions(ifTags);
    if (unmatchedIfs.length) {
        console.warn('Unmatched b:if conditions found:', unmatchedIfs);
    }

    // Check for JSON-LD @id conflicts
    const jsonLdConflicts = findJsonLdIdConflicts(jsonLdScripts);
    if (jsonLdConflicts.length) {
        console.warn('JSON-LD @id conflicts found:', jsonLdConflicts);
    }
}

function findDuplicateMetaTags(metaTags) {
    const metaNames = {};
    const duplicates = [];
    metaTags.forEach(tag => {
        const name = tag.getAttribute('name');
        if (name) {
            if (metaNames[name]) {
                duplicates.push(name);
            }
            metaNames[name] = true;
        }
    });
    return duplicates;
}

function findUnmatchedIfConditions(ifTags) {
    // Example check for unmatched b:if conditions
    return ifTags.filter(tag => !tag.getAttribute('condition')).map(tag => tag.toString());
}

function findJsonLdIdConflicts(jsonLdScripts) {
    const ids = {};
    const conflicts = [];
    jsonLdScripts.forEach(script => {
        try {
            const jsonLd = JSON.parse(script.textContent || '{}');
            const id = jsonLd['@id'];
            if (id) {
                if (ids[id]) {
                    conflicts.push(id);
                }
                ids[id] = true;
            }
        } catch (e) {
            console.error('Error parsing JSON-LD:', e);
        }
    });
    return conflicts;
}

// Export the linting function
module.exports = lintXML;