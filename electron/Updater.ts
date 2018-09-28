import Timer = NodeJS.Timer;
import { Signal } from 'ts-utils';
import { copy, exist, rename } from './utils';
import { dirname, join } from 'path';
import {  } from 'fs';


const UPDATE_PATH = '/home/tsigel/WebstormProjects/WavesGUI/dist/desktop/mainnet/electron/linux-unpacked/resources/app2.asar';

export class Updater {

    public onHasUpdate: Signal<void> = new Signal<void>();
    private readonly time: number;
    private timer: Timer;

    constructor(options: IOptions) {
        this.time = options.interval;

        this.addTimeout();
    }

    public update(): Promise<void> {
        return Updater.hasUpdate()
            .then(status => {
                if (!status) {
                    return Promise.reject(new Error('Has no file to update!'));
                }
                const backupName = 'backup.asar';
                const asarName = 'app.asar';
                const path = dirname(process.execPath);
                const asarFolder = join(path, 'resources');
                const asarPath = join(asarFolder, asarName);

                return rename(asarFolder, asarName, backupName)
                    .then(() => copy(UPDATE_PATH, asarPath));
            });
    }

    private addTimeout() {
        this.clear();

        this.timer = setTimeout(() => {

            Updater.hasUpdate().then(status => {
                if (status) {
                    this.onHasUpdate.dispatch(void 0);
                }

                this.addTimeout();
            });
        }, this.time);
    }

    private clear() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private static hasUpdate(): Promise<boolean> {
        return exist(UPDATE_PATH)
            .then(() => true)
            .catch(() => false);
    }

}


export interface IOptions {
    interval: number;
}
