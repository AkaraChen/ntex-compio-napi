import subprocess, sys, signal
from pathlib import Path
milestone = sys.argv[1]
with open(f'evidence/{milestone}-http.log', 'w') as log:
    def command(args):
        log.write('$ ' + ' '.join(args) + '\n'); log.flush()
        subprocess.run(args, stdout=log, stderr=subprocess.STDOUT, check=True)
    command(['ss', '-ltnp'])
    log.write('$ node scripts/native-smoke.js\n'); log.flush()
    server = subprocess.Popen(['node', 'scripts/native-smoke.js'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    try:
        while True:
            line = server.stdout.readline()
            log.write(line); log.flush()
            if 'READY' in line: break
            if not line: raise RuntimeError('server exited before ready')
        command(['curl', '-i', '--max-time', '5', 'http://127.0.0.1:18721/hello'])
    finally:
        server.send_signal(signal.SIGTERM)
        output, _ = server.communicate(timeout=15)
        log.write(output)
        log.write(f'Node exited naturally after stop: code={server.returncode}\n')
        assert server.returncode == 0
print(Path(f'evidence/{milestone}-http.log').read_text())
