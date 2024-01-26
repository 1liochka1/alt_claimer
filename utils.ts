import axios from "axios";
import fs from "fs";
import path from "path";
import {createPublicClient, defineChain, formatGwei, Hex, http} from "viem";
import {neededGas, rpc} from "./config";
import {mainnet} from "viem/chains";
import * as readline from "readline";

const client = createPublicClient({
    chain: mainnet,
    transport: http(rpc),
})

export async function getProof(address: string) {
    try {
        const response = await axios.post(
            'https://airdrop.altlayer.io/',
            [`${address}`],
            {
                headers : {
                    'authority': 'airdrop.altlayer.io',
                    'accept': 'text/x-component',
                    'accept-language': 'ru,en;q=0.9',
                    'content-type': 'text/plain;charset=UTF-8',
                    'next-action': '6817e8f24aae7e8aed1d5226e9b368ab8c1ded5d',
                    'next-router-state-tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22(homePage)%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
                    'origin': 'https://airdrop.altlayer.io',
                    'referer': 'https://airdrop.altlayer.io/',
                    'sec-ch-ua': '"Chromium";v="118", "YaBrowser";v="23.11", "Not=A?Brand";v="99", "Yowser";v="2.5"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 YaBrowser/23.11.0.0 Safari/537.36',
                }
            }
        )

        const data = (JSON.parse(response.data.split("\n")[1].replace('1:', '')))
        if (data !== null) {
            return {
                amount: data.amount,
                proof: data.proof
            }
        }
        console.log(`${address} - nothing to claim`)
    } catch (e) {
        console.log(`${address} - error ${e}`)
    }

}

export function writeToCSV(address: string, result: string) {
    const mainDirPath = process.cwd()
    const filePath = path.join(mainDirPath, 'results.csv')
    const data = `${address},${result}\n`;

    const fileExists = fs.existsSync(filePath);
    if (!fileExists) {
        const headers = 'address,result\n';
        fs.writeFileSync(filePath, headers);
    }
    fs.appendFile(filePath, data, (err) => {
        if (err) throw err;
    });
}


export function getRandomIntFromTo(min: number, max: number) {
    let delta = max - min;
    return Math.round(min + Math.random() * delta);
}


export async function sleep(time: number) {
    console.debug(`sleeping ${time} secs`)
    await new Promise(resolve => setTimeout(resolve, time*1000))
}


export async function getGasPrice(address: Hex) {

    while (true) {
        try {
            const gas = parseFloat(formatGwei(await client.getGasPrice()));
            console.log(`${address} gwei right now - ${gas}...`)
            if (neededGas > gas) {
                return true;
            }
            console.log(`${address} gwei too much...`)
            await sleep(30)
        } catch (e) {
            console.log(`${address} - error ${e}`)
            await sleep(2)
            return await getGasPrice(address);
        }
    }
}


export async function wait_confirm(hash: Hex) {
    while (true) {
        try {
            const transaction = await client.getTransactionReceipt({
                hash: hash
            })
            if (transaction.status === 'success') {
                return true
            } else if (transaction.status === 'reverted') {
                return false
            }
            await sleep(1)
        } catch (e) {
            console.log(e)
            await sleep(1)
        }
    }


}
export async function read_keys() {
    const array = []
    const readInterface = readline.createInterface({
        input: fs.createReadStream('./keys.txt'),
        crlfDelay: Infinity,
    })
    for await (const line of readInterface) {
        if (line.startsWith('0x')) {
            array.push(line as Hex)
        } else {
            array.push(`0x${line}`)
        }
    }
    return array
}

export const eth = defineChain({
    id: 1,
    network: 'homestead',
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: {
            http: [rpc],
        },
        public: {
            http: [rpc],
        },
    },
    blockExplorers: {
        etherscan: {
            name: 'Etherscan',
            url: 'https://etherscan.io/tx/',
        },
        default: {
            name: 'Etherscan',
            url: 'https://etherscan.io/tx/',
        },
    },
    contracts: {
        ensRegistry: {
            address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        },
        ensUniversalResolver: {
            address: '0xc0497E381f536Be9ce14B0dD3817cBcAe57d2F62',
            blockCreated: 16966585,
        },
        multicall3: {
            address: '0xca11bde05977b3631167028862be2a173976ca11',
            blockCreated: 14353601,
        },
    },
})

