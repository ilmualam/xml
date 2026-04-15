from pathlib import Path
path = Path('asset/xml/ilmualam.xml')
text = path.read_text(encoding='utf-8').splitlines()
changes = {
    2149: "            <a class='title-link' expr:href='data:post.labels ? data:post.labels.first.url : &quot;/search&quot;'><data:messages.viewAll/></a>",
    3230: "            <a class='title-link' expr:href='data:post.labels ? data:post.labels.first.url : &quot;/search&quot;'><data:messages.viewAll/></a>"
}
for idx, new_line in changes.items():
    old_line = text[idx]
    if 'data:post.labels ? &quot;/search/label/&quot; + data:post.labels.first.name : &quot;/search&quot;' not in old_line:
        raise ValueError(f'Unexpected content at line {idx+1}: {old_line}')
    text[idx] = new_line
path.write_text('\n'.join(text) + '\n', encoding='utf-8')
print('patched')
