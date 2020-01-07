/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { QuickPickItem } from 'vscode';

export default class CreateUserItem implements QuickPickItem {
	get label(): string { return `$(plus) Add new user...`; }
}
