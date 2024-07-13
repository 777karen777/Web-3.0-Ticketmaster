const { wait } = require("@testing-library/user-event/dist/utils")
const { expect } = require("chai")
const { ethers } = require("hardhat")

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const NAME = "TokenMaster"
const SYMBOL = "TM"

const OCCASION_NAME = "ETH Texas"
const OCCASION_COST =  tokens(1)
const OCCASION_MAX_TICKETS = 100
const OCCASION_DATE = "Apr 27"
const OCCASION_TIME = "10:00AM CST"
const OCCASION_LOCATION = "Austin, Texas"


describe("TokenMaster", () => {

    let tokenMaster
    let deployer, buyer

    let totalOccasions
    let occasion


    beforeEach(async () => {
        // Setup accounts
        [deployer, buyer] = await ethers.getSigners()

        // Deploying contract
        const TokenMaster = await ethers.getContractFactory(NAME)
        tokenMaster = await TokenMaster.deploy(NAME, SYMBOL)
        await tokenMaster.deployed()

        // Listing an Event/Occasion
        totalOccasions = (await tokenMaster.totalOccasions()).add(1)

        const transaction = await tokenMaster.connect(deployer).list(
            OCCASION_NAME, 
            OCCASION_COST, 
            OCCASION_MAX_TICKETS, 
            OCCASION_DATE, 
            OCCASION_TIME, 
            OCCASION_LOCATION, 
        )
        await transaction.wait()

        occasion = await tokenMaster.connect(deployer).getOccasion(totalOccasions)
    })

    describe("Deployment", () => {

        it("Sets the name", async () => {            
            expect(await tokenMaster.name()).to.equal(NAME)
        })

        it("Sets the symbol", async () => {
            expect(await tokenMaster.symbol()).to.equal(SYMBOL)
        })

        it("Sets the owner", async () => {
            expect(await tokenMaster.owner()).to.equal(deployer.address)
        })
    })

    describe("Listing an Event/Occasion", () => {        
        it("Updates occasion count", async () => {
            expect(await tokenMaster.totalOccasions()).to.equal(totalOccasions)
        })
        
        it("Sets the occasion id", async () => {
            expect(occasion.id).to.equal(totalOccasions)
        })
        
        it("Sets the occasion name", async () => {
            expect(occasion.name).to.equal(OCCASION_NAME)
        })
        
        it("Sets the occasion cost", async () => {
            expect(occasion.cost).to.equal(OCCASION_COST)
        })
        
        it("Sets the occasion tickets", async () => {
            expect(occasion.tickets).to.equal(OCCASION_MAX_TICKETS)
        })
        
        it("Sets the occasion maxTickets", async () => {
            expect(occasion.maxTickets).to.equal(OCCASION_MAX_TICKETS)
        })
        
        it("Sets the occasion date", async () => {
            expect(occasion.date).to.equal(OCCASION_DATE)
        })
        
        it("Sets the occasion time", async () => {
            expect(occasion.time).to.equal(OCCASION_TIME)
        })
        
        it("Sets the occasion location", async () => {
            expect(occasion.location).to.equal(OCCASION_LOCATION)
        })
    })

    describe("Minting and Withdraw", () => {
        const ID = 1
        const SEAT = 50
        const AMOUNT = tokens(1)
        let balanceBefore

        beforeEach(async () => {
            balanceBefore = await ethers.provider.getBalance(deployer.address)

            let transaction = await tokenMaster.connect(buyer).mint(ID, SEAT, {value: AMOUNT})
            await transaction.wait();
            
            
            
        })
        it("Updates tickets count", async () => {
            const mintedOcasion = await tokenMaster.getOccasion(ID)
            expect(mintedOcasion.tickets).to.equal(OCCASION_MAX_TICKETS - 1)
        })        
        
        it("Updates hasBought status", async () => {
            const hasBought = await tokenMaster.hasBought(ID, buyer.address)
            expect(hasBought).to.equal(true)
        })        
        
        it("Updates seatTaken", async () => {
            const seatTaken = await tokenMaster.seatTaken(ID, SEAT)
            expect(seatTaken).to.equal(buyer.address)
        })        
        
        it("Adds the bought seat to seatsTaken", async () => {
            const seatsTaken = await tokenMaster.getSeatsTaken(ID)
            expect(seatsTaken.length).to.equal(1)
            expect(seatsTaken[0]).to.equal(SEAT)
        })

        it("Updates totalSupply", async () => {
            const totalSupply = await tokenMaster.totalSupply()
            expect(totalSupply).to.equal(1)
        })
        
        it("Updates the contract balance", async () => {
            const balance = await ethers.provider.getBalance(tokenMaster.address)
            expect(balance).to.equal(AMOUNT)
        })
        
        it("Updates the owner balance", async () => {
            const transaction = await tokenMaster.connect(deployer).withdraw()
            await transaction.wait()
            const balanceAfter = await ethers.provider.getBalance(deployer.address)
            expect(balanceAfter).to.be.greaterThan(balanceBefore)
            expect(await ethers.provider.getBalance(tokenMaster.address)).to.equal(0)
        })
        
    })

})
