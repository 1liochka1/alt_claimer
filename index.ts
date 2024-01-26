import {createWalletClient, Hex, hexToNumber, http, toHex, WalletClient} from 'viem'
import {delay, shuffleWallets} from "./config";
import {privateKeyToAccount} from "viem/accounts";
import {eth, getGasPrice, getProof, getRandomIntFromTo, read_keys, sleep, wait_confirm, writeToCSV} from "./utils"
import {secp256k1} from '@noble/curves/secp256k1'


const claimAbi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"target","type":"address"}],"name":"AddressEmptyCode","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"AddressInsufficientBalance","type":"error"},{"inputs":[],"name":"ECDSAInvalidSignature","type":"error"},{"inputs":[{"internalType":"uint256","name":"length","type":"uint256"}],"name":"ECDSAInvalidSignatureLength","type":"error"},{"inputs":[{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"ECDSAInvalidSignatureS","type":"error"},{"inputs":[],"name":"EnforcedPause","type":"error"},{"inputs":[],"name":"ExpectedPause","type":"error"},{"inputs":[],"name":"FailedInnerCall","type":"error"},{"inputs":[],"name":"InvalidInitialization","type":"error"},{"inputs":[],"name":"NotInitializing","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"SafeERC20FailedOperation","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint64","name":"version","type":"uint64"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"blocked","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"accounts","type":"address[]"},{"internalType":"bool","name":"status","type":"bool"}],"name":"blocklist","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes32[]","name":"proof","type":"bytes32[]"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes32[]","name":"proof","type":"bytes32[]"},{"internalType":"bool","name":"agreedToTnC","type":"bool"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"claimed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"endTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"initialOwner_","type":"address"},{"internalType":"address","name":"vault_","type":"address"},{"internalType":"address","name":"token_","type":"address"},{"internalType":"bytes32","name":"merkleRoot_","type":"bytes32"},{"internalType":"bytes32","name":"messageHash_","type":"bytes32"},{"internalType":"uint256","name":"startTime_","type":"uint256"},{"internalType":"uint256","name":"endTime_","type":"uint256"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"merkleRoot","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"messageHash","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"setEndTime","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_merkleRoot","type":"bytes32"}],"name":"setMerkleRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_messageHash","type":"bytes32"}],"name":"setMessageHash","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"setStartTime","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newVault","type":"address"}],"name":"setVault","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"startTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"vault","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes32[]","name":"proof","type":"bytes32[]"}],"name":"verifyCalldata","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]
const claimAddress = '0xb58a659Eee982Fe4E6Ce0c2C37EBD0F7E8224D7E'
const message = "By signing this message, you confirm and agree that:\n\n1. You do not reside in, are citizens of, are located in the United States of America or Canada, the People's Republic of China, or countries which are the subject of any sanctions administered or enforced by any country or government or international authority, including without limitation Cuba, North Korea, Timor-Leste, Cambodia, Republic of the Union of Myanmar, Lao People's Democratic Republic, Tanzania, Pakistan, Uganda, Mali, Afghanistan, Albania, Angola, Botswana, Chad, Central African Republic, Eritrea, the Republic of Guinea, Guinea-Bissau, Somalia, Zimbabwe, Democratic Republic of the Congo, Republic of the Congo, Ethiopia, Malawi, Mozambique, Madagascar, Crimea, Kyrgyzstan, Haiti, Bosnia and Herzegovina, Uzbekistan, Turkmenistan, Burundi, South Sudan, Sudan (north), Sudan (Darfur), Nicaragua, Vanuatu, the Republic of North Macedonia, the Lebanese Republic, Bahamas, Kosovo, Iran, Iraq, Liberia, Libya, Syrian Arab Republic, Tajikistan, Uzbekistan, Yemen, Belarus, Bolivia, Venezuela, the regions of Crimea, Donetsk, Kherson, Zaporizhzhia or Luhansk.\n\n2. You are not the subject of economic or trade sanctions administered or enforced by any governmental authority or otherwise designated on any list of prohibited or restricted parties (including the list maintained by the Office of Foreign Assets Control of the U.S. Department of the Treasury) (collectively, \"Sanctioned Person\").\n\n3. You do not intend to transact with any Restricted Person or Sanctioned Person; and\n\n4. You do not, and will not, use a VPN or any other privacy or anonymization tools or techniques to circumvent, or attempt to circumvent, any restrictions that apply to the Services.\n\n5. You have read our disclaimers: https://files.altlayer.io/tokenTnC.pdf and https://files.altlayer.io/airdrop_claim_ui_disclaimer.pdf in full."



const claimResult = async (key: Hex) => {
    const client = createWalletClient({
        chain: eth, account: privateKeyToAccount(key), transport: http()
    })
    const address = client.account.address.toLowerCase()
    const claimInfo = await getProof(client.account.address)
    if (!claimInfo) {
        writeToCSV(address, 'nothing to claim')
        return
    }

    const {v, r, s} = await sign(key, client)
    const args = [claimInfo.amount, claimInfo.proof, v, toHex(r), toHex(s)]
    await getGasPrice(address)
    try {
        const txHash = await client.writeContract({
            address: claimAddress.toLowerCase(),
            abi: claimAbi,
            functionName: 'claim',
            args: args,
            value: 0
        })
        const txStatus = await wait_confirm(txHash)
        if (!txStatus) {
            writeToCSV(address, `something went wrong in tx ${eth.blockExplorers.etherscan}${txHash}`)
            console.log(`${address} - something went wrong in tx ${eth.blockExplorers.etherscan}${txHash}`)
            await sleep(getRandomIntFromTo(delay[0], delay[1]))
            return
        }
        console.log(`${address} - successfully claimed ${claimInfo.amount} ALT ${eth.blockExplorers.etherscan}${txHash}`)
        await sleep(getRandomIntFromTo(delay[0], delay[1]))
        writeToCSV(address, `successfully claimed ${claimInfo.amount} ALT`)
    } catch (e) {
        writeToCSV(address, e)
        console.log(`${address} - error ${e}`)
        return
    }
}

async function sign(key: Hex, client: WalletClient) {
    const signature = await client.signMessage({
        account: privateKeyToAccount(key),
        message: message,
    })
    const { r, s } = secp256k1.Signature.fromCompact(signature.slice(2, 130))
    return {v:  hexToNumber(`0x${signature.slice(130)}`), r: r, s: s}
}



async function main() {
    const keys = await read_keys()
    console.log(`\n${" ".repeat(32)}автор - https://t.me/iliocka${" ".repeat(32)}\n`);

    if (shuffleWallets) {
        keys.sort(() => Math.random() - 0.5);
    }
    console.log(`${eth.blockExplorers.etherscan.url}0xf2e9da799663e0b6217a9e5ecb6a7378b8f26aba6d95c918ceb3c00f16acf81f`)
    for (const key of keys) {
        await claimResult(key)
    }
    console.log(`\n$создан файл с результатами - results.csv`)
    console.log(`\n${" ".repeat(32)}автор - https://t.me/iliocka${" ".repeat(32)}\n`);
    console.log(`\n${" ".repeat(32)}donate - EVM 0xFD6594D11b13C6b1756E328cc13aC26742dBa868${" ".repeat(32)}\n`)
    console.log(`\n${" ".repeat(32)}donate - trc20 TMmL915TX2CAPkh9SgF31U4Trr32NStRBp${" ".repeat(32)}\n`)
}

await main()

