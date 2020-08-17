import express, { } from 'express'
import EventEmitter from 'eventemitter3'

import fs from 'fs/promises'
import path from 'path'

export class OverthinkServer {
  #server = express()

  public readonly events = new EventEmitter()

  public async init(port: number) {


    this.#server.listen(port)
  }

  private async getComponents(componentsDir: string) {
    const absolutePath = path.resolve(componentsDir)
    const componentsDirItems = await fs.readdir(absolutePath)
    const componentsPath: string[] = []

    for (const itemName of componentsDirItems) {
      const itemPath = path.join(absolutePath, itemName)
      const itemStat = await fs.stat(itemPath)

      if (itemStat.isDirectory()) componentsPath.push(path.resolve(itemPath, 'index.js'))
    }
  }
}
