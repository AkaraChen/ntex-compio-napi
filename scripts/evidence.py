from pathlib import Path
p = Path('EVIDENCE.md')
import sys
with p.open('a') as f:
    f.write('\n## ' + sys.argv[1] + '\n\n')
    for command, filename in zip(sys.argv[2::2], sys.argv[3::2]):
        f.write('$ `' + command + '`\n\n```text\n' + Path(filename).read_text() + '```\n\n')
