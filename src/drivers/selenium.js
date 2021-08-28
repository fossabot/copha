// eslint-disable-next-line no-unused-vars
const path = require('path')
const Utils = require('uni-utils')
// eslint-disable-next-line no-unused-vars
const { By, until, Key } = require('selenium-webdriver')
const Driver = require('../class/driver')
const webdriver = require('selenium-webdriver')
const proxy = require('selenium-webdriver/proxy')
const firefox = require('selenium-webdriver/firefox')
const chrome = require('selenium-webdriver/chrome')
const { Builder } = require('selenium-webdriver')

class Selenium extends Driver {
    DriverModule = require('selenium-webdriver')
    #conf = null
    #driver = null
    constructor(conf) {
        super(conf)
        this.#conf = conf
    }
    // core process
    async init() {
        try {
            const options = this.configOptions()
            const driverBuilder = await this.getDriverBuilder(options)
            this.setProxy(driverBuilder)
            this.#driver = driverBuilder.build()
            await this.#driver.manage().setTimeouts({ pageLoad: 30000, implicit: 10000 })
        } catch (error) {
            throw new Error(`Driver init failed : ${error}`)
        }
        this.log.info('web driver init end')
    }
    getDriverBuilder(options){
        let driverBuilder = new Builder()
        switch (this.#conf.main?.driver) {
            case 'chrome':
                {
                    driverBuilder.withCapabilities(webdriver.Capabilities.chrome())
                        .setChromeOptions(options)
                }
                break;
            default:
                {
                    driverBuilder.withCapabilities(webdriver.Capabilities.firefox())
                        .setFirefoxOptions(options)
                }
        }
        return driverBuilder
    }
    configOptions(){
        let options = null
        switch (this.#conf.main?.driver) {
            case 'chrome':
                {
                    options = new chrome.Options()
                    // options.setPreference("network.proxy.socks_remote_dns", true)
                }
                break;
            default:
                {
                    options = new firefox.Options()
                    options.setPreference("network.proxy.socks_remote_dns", true)
                }
        }
        if(this.getEnv("COPHA_SHOW_HEADLESS_GUI")){

        }else{
            if (this.#conf.main.debug) {

            }else{
                options.headless()
            }
        }
        return options
    }
    setProxy(driverBuilder){
        const _setProxy = () => {
            driverBuilder.setProxy(proxy.socks('127.0.0.1:1086', 5))
            this.log.warn('Task run with proxy !!!')
        }
        if(process.env['COPHA_USE_PROXY']){
            _setProxy()
        }else{
            if (this.#conf.main.useProxy) {
                _setProxy()
            }
        }
    }
    setPreference(){

    }
    async open(url) {
        // 3次重试
        const maxCount = 3
        let count = 1
        try {
            await this.#driver.get(url||this.#conf.main.targetUrl)
        } catch (error) {
            while (count <= maxCount) {
                this.log.warn(`refresh it again ${count}/${maxCount}`)
                try {
                    await this.#driver.navigate().refresh()
                    break
                } catch (error) {
                    this.log.err(`open url err: ${error}`)
                    count++
                    await Utils.sleep(1000)
                }
            }
        }
        if (count == 4) {
            throw new Error('open url failed, task stoped')
        }
    }
    async clear() {
        if (this.#driver) {
            try {
                this.#driver.quit()
            } catch (error) {
                this.log.err(`clear web driver err: ${error.message}`)
            } finally{
                this.#driver = null
            }
        }
    }

    // eslint-disable-next-line no-unused-vars
    async waitTwoTab() {
        const maxCount = 30
        const waitTime = 1000
        let count = 1
        while (count <= maxCount) {
            await this.#driver.sleep(waitTime)
            const whs = await this.#driver.getAllWindowHandles()
            if (whs.length == 2) return
            if(whs.length>2){
                // try {
                //     this._clearTab()
                // } catch (e) {
                //     this.log.err(`_clearTab err: ${e.message}`)
                // }
                throw new Error(`waitTwoTab error: tab nums ${whs.length}`)
            }
            count++
        }
        throw new Error('waitTwoTab error: timeout')
    }
    async waitExecFunc(funcName) {
        const maxCount = 3
        const waitTime = 1000
        let count = 1
        while (count <= maxCount) {
            const funcExist = await this.#driver.executeScript((f) => eval("typeof " + f), funcName)
            if (funcExist == 'function') return
            count++
            await this.#driver.navigate().refresh()
            await this.#driver.sleep(waitTime)
        }
        this.log.err('not find function: ', funcName)
    }
    async swithToNewTab(){
        const whs = await this.#driver.getAllWindowHandles()
        await this.#driver.switchTo().window(whs[1])
        // await driver.wait(until.elementLocated(By.xpath(fields_xpath[0])), 30000)
    }
    async closeCurrentTab() {
        const whs = await this.#driver.getAllWindowHandles()
        await this.#driver.close()
        await this.#driver.switchTo().window(whs[0])
    }
    async _clearTab(){
        const whs = await this.#driver.getAllWindowHandles()
        for (let i = 1; i < whs.length; i++) {
            await this.#driver.switchTo().window(whs[i])
            await this.#driver.close()
        }
        await this.#driver.switchTo().window(whs[0])
    }
    async waitPage(p, driver) {
        const min_xpath = `//*[@id="pagetest2"]/table/tbody/tr/td/table/tbody/tr/td[11]/span[1]`
        const max_xpath = `//*[@id="pagetest2"]/table/tbody/tr/td/table/tbody/tr/td[11]/span[2]`
        const min_num = parseInt(await (await driver.findElement(By.xpath(min_xpath))).getText())
        const max_num = parseInt(await (await driver.findElement(By.xpath(max_xpath))).getText())
        const waitTime = 1000
        let count = 10
        while (count !== 0) {
            if (min_num < p && p <= max_num) break
            await driver.sleep(waitTime)
            if (count == 0) {
                throw new Error('wait page error')
            }
            count--
        }
    }
}

module.exports = Selenium
