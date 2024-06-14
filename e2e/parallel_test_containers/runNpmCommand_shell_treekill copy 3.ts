import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import treeKill from 'tree-kill';

export async function runNpmCommand(
  port: number,
  serviceApiUrl: string,
): Promise<ChildProcess | null> {
  // const dir = "c:/work/code/121-platform";
  const currentDir = process.cwd(); // Get the current working directory
  const dir = path.resolve(currentDir, '../');
  const command = `npm`;
  // let child: ChildProcess | null = null;
  const args = [
    'start',
    '--prefix',
    'interfaces/Portal/',
    '--',
    '--port',
    port.toString(),
  ];

  // Prepare the options with the environment variable
  const options = {
    cwd: dir,
    env: { ...process.env, NG_URL_121_SERVICE_API: serviceApiUrl },
    shell: true,
    detached: true, // To let the process run independently
    stdio: ['ignore', 'ignore', 'ignore'], // Ignore stdio to allow the process to run independently
  };

  console.log(`Running command: ${command} ${args.join(' ')} in ${dir}`);

  const out = fs.openSync('portal-server-logs1.txt', 'a');
  const err = fs.openSync('portal-server-logs1.txt', 'a');

  try {
    const child = spawn(command, args, {
      ...options,
      stdio: ['ignore', out, err],
    });

    if (child.pid) {
      console.log(`Started process with PID: ${child.pid}`);
      fs.writeFileSync('process.pid', child.pid.toString());
      return child;
    } else {
      throw new Error('Failed to start child process.');
    }
  } catch (error) {
    console.error(
      `Error starting process: ${error instanceof Error ? error.message : error}`,
    );
  }
  return null;
}

export async function stopNpmCommand(child: number | null): Promise<void> {
  try {
    if (child) {
      console.log(`Stopping shell process with PID: ${child}`);

      // Terminate the shell process
      treeKill(child, 'SIGKILL', (err) => {
        if (err) {
          console.error(`Error stopping shell process: ${err}`);
        } else {
          console.log(`Stopped shell process with PID: ${child}`);
        }
      });

      // Wait for a brief moment to allow the shell process to clean up
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if there are any child processes spawned by the shell
      const pidFilePath = 'process.pid';
      if (fs.existsSync(pidFilePath)) {
        const childProcessPids = fs.readFileSync(pidFilePath, 'utf-8').split('\n').map(Number);

        // Terminate each child process
        childProcessPids.forEach(pid => {
          treeKill(pid, 'SIGKILL', (err) => {
            if (err) {
              console.error(`Error stopping child process with PID ${pid}: ${err}`);
            } else {
              console.log(`Stopped child process with PID: ${pid}`);
            }
          });
        });

        // Clean up the PID file
        fs.unlinkSync(pidFilePath);
      }
    } else {
      throw new Error('Child process PID is null.');
    }
  } catch (error) {
    console.error(`Error stopping npm command: ${error}`);
  }
}
