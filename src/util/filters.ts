/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

export default class Filters {
    static readonly tokenRegex = /--token=[^\s]*/;

    static filterToken(value: string): string {
        return value ? value.replace(Filters.tokenRegex, '--token **********') : value;
    }

    static readonly passwordRegex = /-p\s+'([^']+)'/;

    static filterPassword(value: string): string {
        return value? value.replace(Filters.passwordRegex, '-p **********') : value;
    }
}
