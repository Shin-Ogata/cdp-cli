﻿import * as fs from "fs-extra";
import * as path from "path";
import * as commander from "commander";
import * as chalk from "chalk";
import { IBoilerplateOptions } from "cdp-lib";

/**
 * @interface ICommandLineOptions
 * @brief     コマンドライン用オプションインターフェイス
 */
export interface ICommandLineOptions {
    force: boolean;     // エラー継続用
    targetdir: string;  // 作業ディレクトリ指定
    config: string;     // コンフィグファイル指定
    verbose: boolean;   // 詳細ログ
    silent: boolean;    // silent mode
}

/**
 * @interface ICommandLineInfo
 * @brief     コマンドライン情報格納インターフェイス
 */
export interface ICommandLineInfo extends IBoilerplateOptions {
    pkgDir: string;                     // CLI インストールディレクトリ
    action: string;                     // アクション定数
    target: string;                     // コマンドターゲット
    installedDir: string;               // CLI インストール
    cliOptions: ICommandLineOptions;    // コマンドラインで渡されたオプション
}

//___________________________________________________________________________________________________________________//

/**
 * @class CommandParser
 * @brief コマンドラインパーサー
 */
export class CommandParser {

    ///////////////////////////////////////////////////////////////////////
    // public static methods

    /**
     * コマンドラインのパース
     *
     * @param  {String} argv       引数を指定
     * @param  {Object} [options]  オプションを指定
     * @returns {ICommandLineInfo}
     */
    public static parse(argv: string[], options?: any): ICommandLineInfo {
        const cmdline = <ICommandLineInfo>{
            pkgDir: this.getPackageDirectory(argv),
        };
        const pkg = JSON.parse(fs.readFileSync(path.join(cmdline.pkgDir, "package.json"), "utf8").toString());

        commander
            .version(pkg.version)
            .option("-f, --force", "Continue execution even if in error situation")
            .option("-t, --targetdir <path>", "Specify project target directory")
            .option("-c, --config <path>", "Specify config file path")
            .option("-v, --verbose", "Show debug messages.")
            .option("-s, --silent", "Run as silent mode.")
        ;

        commander
            .command("init")
            .description("init project")
            .action(() => {
                cmdline.action = "init";
            })
            .on("--help", () => {
                console.log(chalk.green("  Examples:"));
                console.log("");
                console.log(chalk.green("    $ cdp init"));
                console.log("");
            });

        commander
            .command("create <target>")
            .description("create boilerplate for 'app' | 'module'")
            .action((target: string) => {
                if (/^(app|module)$/i.test(target)) {
                    cmdline.action = "create";
                    cmdline.target = target;
                } else {
                    console.log(chalk.red.underline("  unsupported target: " + target));
                    this.showHelp();
                }
            })
            .on("--help", () => {
                console.log(chalk.green("  Examples:"));
                console.log("");
                console.log(chalk.green("    $ cdp create app"));
                console.log(chalk.green("    $ cdp create module"));
                console.log(chalk.green("    $ cdp create app -c setting.json"));
                console.log("");
            });

        commander
            .command("*", null, { noHelp: true })
            .action((cmd) => {
                console.log(chalk.red.underline("  unsupported command: " + cmd));
                this.showHelp();
            });

        commander.parse(argv);

        if (argv.length <= 2) {
            this.showHelp();
        }

        cmdline.cliOptions = this.toCommandLineOptions(commander);

        return cmdline;
    }

    ///////////////////////////////////////////////////////////////////////
    // private static methods

    /**
     * CLI のインストールディレクトリを取得
     *
     * @param  {String[]} argv 引数
     * @return {String} インストールディレクトリ
     */
    private static getPackageDirectory(argv: string[]): string {
        const execDir = path.dirname(argv[1]);
        return path.join(execDir, "..");
    }

    /**
     * CLI option を ICommandLineOptions に変換
     *
     * @param  {Object} commander parse 済み comannder インスタンス
     * @return {ICommandLineOptions} option オブジェクト
     */
    private static toCommandLineOptions(commander: any): ICommandLineOptions {
        return {
            force: !!commander.force,
            targetdir: commander.targetdir,
            config: commander.config,
            verbose: !!commander.verbose,
            silent: !!commander.silent,
        };
    }

    /**
     * ヘルプ表示して終了
     */
    private static showHelp(): void {
        const inform = (text: string) => {
            return chalk.green(text);
        };
        commander.outputHelp(<any>inform);
        process.exit(1);
    }
}