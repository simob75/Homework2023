const { ethers } = require('hardhat');
const { expect } = require('chai');

const tokens = (n) =>{
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('Crowdsale', ()=>{
	let crowdsale, token
	let accounts, deployer, user1

	beforeEach(async()=>{
		const Crowdsale = await ethers.getContractFactory('Crowdsale')
		const Token = await ethers.getContractFactory('Token')

		token = await Token.deploy('My Token','DAPP','18','1000000')
		accounts = await ethers.getSigners()
		deployer = accounts[0]
		user1 = accounts[1]
		crowdsale = await Crowdsale.deploy(token.address, ether(1), '1000000')
		let transaction = await token.connect(deployer).transfer(crowdsale.address, tokens(1000000))
		await transaction.wait()

	})

	describe('Deployment', async()=>{
		it('Sends tokens to the Crowdsale contract', async()=>{
			expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(1000000))
			console.log('Crowdsale balance: ',await token.balanceOf(crowdsale.address))
			console.log('Token balance: ', await token.balanceOf(token.address))
		})

		it('Returns the price', async()=>{
			expect(await crowdsale.price()).to.equal(ether(1))
		})

		it('Has the correct address', async()=>{
			expect(await crowdsale.token()).to.equal(token.address)
		})

		it('Sets the correct maximum tokens amount',async()=>{
			expect(await crowdsale.maxTokens()).to.be.equal(1000000)
		})
	})

	describe('Buying Tokens', async()=>{
		let amount = tokens(10)
		let transaction, result, transaction1, result1

		describe('Success', async()=>{

		beforeEach(async()=>{
			transaction1 = await crowdsale.connect(deployer).setAllowList(user1.address)
			result1 = await transaction1.wait()
		    transaction = await crowdsale.connect(user1).buyTokens(amount, { value: ether(10)})
			result = await transaction.wait()
		})

		it('Adds addresses to the whitelist', async()=>{
			expect(await crowdsale.allowList(user1.address)).to.equal(true)
		})

		it('Transfers tokens', async()=>{
			expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(999990))
			expect(await token.balanceOf(user1.address)).to.equal(amount)
		})

		it('Updated contract ether balances', async()=>{
			expect(await token.provider.getBalance(crowdsale.address)).to.be.equal(amount)
		})

		it('Updates tokens sold', async()=>{
			expect(await crowdsale.tokenSold()).to.be.equal(amount)
		})

		it('Emits a buy event', async()=>{
			//console.log(result)
			await expect(transaction).to.emit(crowdsale, "Buy").withArgs(amount, user1.address);
		})

		})

		describe('Failure', ()=>{

			beforeEach(async()=>{

			})
			it('Rejects insufficient eths', async()=>{
				await expect(crowdsale.connect(user1).buyTokens(tokens(10), { value: 0})).to.be.reverted

			})
		})
	})

	describe('Sending ETH', ()=>{
		let transaction, result, transaction1, result1
		let amount = ether(10)
		
		describe('Success', ()=>{

			beforeEach(async()=>{
				transaction1 = await crowdsale.connect(deployer).setAllowList(user1.address)
			    result1 = await transaction1.wait()
				transaction = await user1.sendTransaction({ to: crowdsale.address, value: amount })
			  	result = await transaction.wait()
		})

			it('Updates contracts ether balance', async()=>{
				expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(amount)
			})

			it('Updates user token balance', async()=>{
				expect(await token.balanceOf(user1.address)).to.equal(amount)
			})

		})

	})

	describe('Updating Price', () => {
		let transaction, result
		let price = ether(2)

		describe('Success', () => {

			beforeEach(async() => {
				transaction = await crowdsale.connect(deployer).setPrice(ether(2))
				result = await transaction.wait()
			})

			it('Updates the price', async() => {
				expect(await crowdsale.price()).to.equal(ether(2))
			})

		})

		describe('Failure', () => {
			it('Prevents non owners from updating price', async() =>{
				await expect(crowdsale.connect(user1).setPrice(ether(2))).to.be.reverted
			})
		})
	})

	describe('Finalizing sale', async()=>{
		let transaction, result, transaction1, result1
		let amount = tokens(10)
		let value = ether(10)

		describe('Success', async()=>{
			beforeEach(async()=>{
				transaction1 = await crowdsale.connect(deployer).setAllowList(user1.address)
			    result1 = await transaction1.wait()
				transaction = await crowdsale.connect(user1).buyTokens(amount, { value: value })
				result = await transaction.wait()
				transaction = await crowdsale.connect(deployer).finalize()
				result = await transaction.wait()
			})

			it('Transfers remaining tokens to owner', async()=>{
				expect(await token.balanceOf(crowdsale.address)).to.equal(0)
				expect(await token.balanceOf(deployer.address)).to.equal(tokens(999990))
			})

			it('Emits Finalize event',async()=>{
				expect(await transaction).to.emit(crowdsale, "Finalize").withArgs(amount, value)
			})

		})

		describe('Failure', async()=>{
			it('Prevents non-owner accounts from finalizing', async()=>{
			await expect(crowdsale.connect(user1).finalize()).to.be.reverted
			})
		})
	})

})