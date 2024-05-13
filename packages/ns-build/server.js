"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const next_server_1 = __importDefault(require("next/dist/server/next-server"));
const serverless_http_1 = __importDefault(require("serverless-http"));
// @ts-ignore
const required_server_files_json_1 = require("./.next/required-server-files.json");
const imageTypes = ['webp', 'jpeg', 'png', 'gif', 'avif', 'svg'];
const showDebugLogs = process.env.SHOW_DEBUG_LOGS === 'true';
const useCustomServerSidePropsHandler = (path) => process.env.DEFAULT_SS_PROPS_HANDLER !== 'true' &&
    path.includes('/_next/data/');
const getProps = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    const path = './.next/server/pages/' +
        event.rawPath
            .replace('/_next/data/', '')
            .split('/')
            .slice(1)
            .join('/')
            .replace('.json', '.js');
    showDebugLogs && console.log({ path });
    const { getServerSideProps } = require(path);
    const customResponse = yield getServerSideProps(context);
    showDebugLogs && console.log({ customResponse });
    const response = {};
    response.statusCode = 200;
    response.body = JSON.stringify({ pageProps: customResponse.props });
    showDebugLogs && console.log({ response });
    return response;
});
const nextServer = new next_server_1.default({
    hostname: 'localhost',
    port: 3000,
    dir: './',
    dev: false,
    conf: Object.assign({}, required_server_files_json_1.config),
    customServer: true,
});
const main = (0, serverless_http_1.default)(nextServer.getRequestHandler(), {
    binary: ['*/*'],
    provider: 'aws',
});
const handler = (event, context, callback) => {
    showDebugLogs && console.debug({ event });
    showDebugLogs && console.debug({ context });
    const path = event.rawPath;
    if (imageTypes.some(type => path.includes(type))) {
        const baseUrl = event.headers['x-forwarded-proto'] + '://' + event.headers['x-forwarded-host'];
        const response = {
            statusCode: 301,
            headers: {
                Location: baseUrl + '/assets' + path,
            },
        };
        return callback(null, response);
    }
    return useCustomServerSidePropsHandler(event.rawPath)
        ? getProps(event, context)
        : main(event, context);
};
exports.handler = handler;
