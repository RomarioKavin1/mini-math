import { main as main1 } from './1_e2e.js'

// This is not right way to test, but comment out tests you don't want
async function main() {
  await main1()
}

main().then(console.log).catch(console.error)
