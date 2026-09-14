import subprocess, signal
with open('evidence/m4-demo.log', 'w') as log:
    log.write('$ ss -ltnp\n'); log.flush()
    subprocess.run(['ss', '-ltnp'], stdout=log, check=True)
    log.write('$ node examples/demo.js\n'); log.flush()
    server = subprocess.Popen(['node', 'examples/demo.js'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    try:
        while True:
            line = server.stdout.readline(); log.write(line); log.flush()
            if 'READY:' in line: break
            if not line: raise RuntimeError('demo exited before listening')
        for path, args in [('/hello', []), ('/users/alice', []), ('/echo', ['-X', 'POST', '--data-binary', 'hello body']), ('/optional', []), ('/optional/Ada', []), ('/files/a/b.txt', []), ('/missing', []), ('/fail', [])]:
            cmd = ['curl', '-sS', '-i', '--max-time', '5', *args, 'http://127.0.0.1:18731' + path]
            log.write('$ ' + ' '.join(repr(x) if ' ' in x else x for x in cmd) + '\n'); log.flush()
            subprocess.run(cmd, stdout=log, stderr=subprocess.STDOUT, check=True)
            log.write('\n'); log.flush()
    finally:
        server.send_signal(signal.SIGTERM)
        output, _ = server.communicate(timeout=15)
        log.write(output)
        log.write(f'Node exited naturally: code={server.returncode}\n')
        assert server.returncode == 0
