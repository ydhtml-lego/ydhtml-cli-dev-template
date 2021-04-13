const fse = require('fs-extra');
const inquirer = require('inquirer');
const glob = require('glob').sync
const ejs = require('ejs')

/**
 * @description ejs 渲染
 */
async function ejsRender(options) {
    // console.log('options = ', JSON.stringify(options))
    const dir = options.targetPath
    const projectInfo = options.data
    return new Promise((resolve, reject) => {
        // 批量获取所有文件以及文件夹

        const files = glob('**', {
            // 获取当前执行命令的目录
            cwd: dir,
            // 过滤一些文件
            ignore: options.ignore,
            // 过滤所有文件夹
            nodir: true
        })
        console.log('files', files)
        Promise.all(files.map(file => {
            const filePath = path.join(dir, file)
            console.log('filePath', filePath)
            return new Promise((resolve1, reject1) => {
                ejs.renderFile(filePath, projectInfo, {},  (err, result) => {
                    // console.log(err, result)
                    if (err) {
                        reject1(err)
                    } else {
                        fse.writeFileSync(filePath, result)
                        resolve1(result)
                    }
                })
            })
        })).then(() => {
            resolve()
        }).catch(err => {
            reject(err)
        })
    })
}


async function install(options) {

    const projectPrompt = []
    const descriptionPrompt = {
        type: 'input',
        name: 'description',
        message: '请输入項目描述信息',
        default: '',
        validate(v) {

            const done = this.async();

            setTimeout(function() {
                if (!v) {
                    done('请输入項目的描述信息');
                    return;
                }
                // Pass the return value in the done callback
                done(null, true);
                return
            }, 0);
        }
    }

    projectPrompt.push(descriptionPrompt)
    const projectInfo = await inquirer.prompt(projectPrompt)
    options.projectInfo.description = projectInfo.description
    const { sourcePath, targetPath } = options
    console.log(projectInfo.description)
    try {
        console.log('coppy')
        fse.ensureDirSync(sourcePath)
        fse.ensureDirSync(targetPath)
        fse.copySync(sourcePath, targetPath)
        const templateIgnore = options.templateInfo.ignore || []
        const ignore = ['**/node_modules/**', ...templateIgnore]
        console.log('render start')
        await ejsRender({ ignore, targetPath, data: options.projectInfo })
        console.log('render end')
    } catch (e) {
        console.log('e', e)
        throw e
    }
}

module.exports = install