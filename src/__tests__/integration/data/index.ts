import * as compatData_ from './data.json';
// fancy way to import json that works in both node.js and the browser
export const compatData = (compatData_.default || compatData_) as { [key: string]: string };
