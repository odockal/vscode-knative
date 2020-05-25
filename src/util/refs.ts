/*-----------------------------------------------------------------------------------------------
 * Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
 * Licensed under the MIT License. See ./refs.license.txt for license information.
 *-----------------------------------------------------------------------------------------------*/
//  Inspired by https://github.com/sindresorhus/remote-git-tags

import url = require('url');
import net = require('net');
import gitClient = require('git-fetch-pack');
import transport = require('git-transport-protocol');

export enum Type {
  TAG,
  BRANCH,
}

export interface Ref {
  name: string;
  type: Type;
  hash: string;
}

export class Refs {
  static async fetchTag(input: string): Promise<Map<string, Ref>> {
    return new Promise((resolve, reject) => {
      const inputTag: string = input.replace(/^(?!(?:https|git):\/\/)/, 'https://');

      const tcp = net.connect({
        host: url.parse(inputTag).host,
        port: 9418,
      });
      const client = gitClient(inputTag);
      const tags = new Map<string, Ref>();

      client.refs.on('data', (ref: { name: string; hash: string }) => {
        if (!ref.name.includes('/')) {
          tags.set(ref.name, { name: ref.name, type: Type.BRANCH, hash: ref.hash.substr(0, 7) });
          return;
        }
        const name = ref.name.split('/')[2].replace(/\^\{\}$/, '');
        if (ref.name.startsWith('refs/heads')) {
          tags.set(name, { name, type: Type.BRANCH, hash: ref.hash.substr(0, 7) });
        }

        if (ref.name.startsWith('refs/tags')) {
          tags.set(name, { name, type: Type.TAG, hash: ref.hash.substr(0, 7) });
        }
      });
      client
        .pipe(transport(tcp))
        .on('error', reject)
        .pipe(client)
        .on('error', reject)
        .once('end', () => resolve(tags));
    });
  }
}
