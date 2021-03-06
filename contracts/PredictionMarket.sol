pragma solidity ^0.6.0;

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
    address public owner;

    event OwnershipRenounced(address indexed previousOwner);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor() public {
        owner = msg.sender;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /**
     * @dev Allows the current owner to relinquish control of the contract.
     * @notice Renouncing to ownership will leave the contract without an owner.
     * It will not be possible to call the functions with the `onlyOwner`
     * modifier anymore.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipRenounced(owner);
        owner = address(0);
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param _newOwner The address to transfer ownership to.
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        _transferOwnership(_newOwner);
    }

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param _newOwner The address to transfer ownership to.
     */
    function _transferOwnership(address _newOwner) internal {
        require(_newOwner != address(0));
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
}

contract PredictionMarket is Ownable {
    /**
     * -------------------------------------
     * -------------------------------------
     *              MARKETS
     * -------------------------------------
     * Only 3 options are allowed
     * TODO: Allow for more
     *
     **/
    enum MarketState {CLOSED, OPEN, PENDING_RESOLUTION, RESOLVED}

    struct Market {
        bytes32 fromToken;
        bytes32 toToken;
        // Resolver addr
        address aggregatorAddress;
        // Stake
        bool optionsConfigured;
        uint256 totalStakedOpt1;
        uint256 totalStakedOpt2;
        uint256 totalStakedOpt3;
        // Open and Close
        uint256 opensAt;
        uint256 closesAt;
        // Forecast time
        uint256 forecastTime;
        MarketState state;
    }

    uint256 marketId = 0;
    mapping(uint256 => Market) markets;

    /**
     * -------------------------------------
     * -------------------------------------
     *              OPTIONS.
     * -------------------------------------
     *
     * opening and closing price ranges for each option
     * Option Nos. - 1, 2, 3
     *
     **/

    struct OptionRange {
        int256 startPrice;
        int256 endPrice;
    }

    mapping(uint256 => mapping(uint256 => OptionRange)) optionInfoForMarket;

    /**
     * -------------------------------------
     * -------------------------------------
     *              STAKE INFO.
     * -------------------------------------
     *
     * User stake details including the optionNo chosen and
     * amount staked for that particular option
     **/
    struct Stake {
        uint8 optionNo;
        uint256 amt;
    }

    mapping(uint256 => mapping(address => Stake)) userStakeInfoForAMkt;

    // Update winning option for market on resolution
    mapping(uint256 => uint256) winningOptForMkt;

    /**
     * -------------------------------------
     * -------------------------------------
     *              EVENTS
     * -------------------------------------
     **/
    event MarketCreated(uint256 indexed _marketId);
    event UserStaked(
        address indexed _user,
        uint256 indexed _marketId,
        uint256 indexed _optionNo,
        uint256 _amount
    );

    /**
     * -------------------------------------
     * -------------------------------------
     *              MODIFIERS
     * -------------------------------------
     **/
    modifier marketExists(uint256 _marketId) {
        require(
            markets[_marketId].aggregatorAddress != address(0),
            "Market not exists"
        );
        _;
    }

    // Checks if a market is OPEN
    // If it is not, tries to compare openingTime, update state to OPEN
    // and then tries to proceed
    modifier marketOpen(uint256 _marketId) {
        if (markets[_marketId].state != MarketState.OPEN) {
            updateMarketStateBasedOnTime(_marketId);
        }

        require(
            markets[_marketId].state == MarketState.OPEN,
            "Market not yet open"
        );
        _;
    }

    // Identify if a market is waiting to be resolved
    modifier marketToBeResolved(uint256 _marketId) {
        require(
            markets[_marketId].state != MarketState.RESOLVED,
            "already resolved"
        );
        if (markets[_marketId].state != MarketState.PENDING_RESOLUTION) {
            updateMarketStateBasedOnTime(_marketId);
        }

        require(
            markets[_marketId].state == MarketState.PENDING_RESOLUTION,
            "Market state not pending resln."
        );
        _;
    }

    /**
     * -------------------------------------
     * -------------------------------------
     *              CORE LOGIC
     * -------------------------------------
     **/

    /**
     * Add a new Market
     * 
     * @param _aggregatorAddress - Chainlink Aggregator address
     *                             For e.g., BTC/USDT
     * @param _fromToken         -
     * @param _toToken           -
     * @param _opensAt           - Market opening time
     * @param _closesAt          - Bids close at
     *                             Ideally 30-45 min gap to forecast time
     * @param _forecastAt        - Forecast time
     **/
    function addMarket(
        IAggregator _aggregatorAddress,
        bytes32 _fromToken,
        bytes32 _toToken,
        uint256 _opensAt,
        uint256 _closesAt,
        uint256 _forecastAt
    ) public onlyOwner returns (uint256 _marketId) {
        _marketId = marketId++;
        markets[_marketId] = Market({
            aggregatorAddress: address(_aggregatorAddress),
            fromToken: _fromToken,
            toToken: _toToken,
            optionsConfigured: false,
            totalStakedOpt1: 0,
            totalStakedOpt2: 0,
            totalStakedOpt3: 0,
            opensAt: _opensAt,
            closesAt: _closesAt,
            forecastTime: _forecastAt,
            state: MarketState.CLOSED
        });

        emit MarketCreated(_marketId);
    }
    
    /**
     * Configure options for the new Market
     * 
     * Options are fixed at 3 right now.
     * Each option has a range startPrice and endPrice
     * 
     * @param _marketId    - MarketID concerned
     * @param _startPrices - Option starting ranges
     * @param _endPrices   - Option end ranges
     **/
    function configureOptionRanges(
        uint256 _marketId,
        int256[3] memory _startPrices,
        int256[3] memory _endPrices
    ) public onlyOwner marketExists(_marketId) {
        uint256 OPTION_START = 1;
        uint256 OPTION_END = 3;

        for (uint256 i = OPTION_START; i <= OPTION_END; i++) {
            optionInfoForMarket[_marketId][i] = OptionRange({
                startPrice: _startPrices[i - 1],
                endPrice: _endPrices[i - 1]
            });
        }

        markets[_marketId].optionsConfigured = true;
    }

    /**
     * Stake on a marketID against a given option
     * 
     * @param _marketId -
     * @param _optionNo - 
     **/
    function stake(uint256 _marketId, uint256 _optionNo)
        public
        payable
        marketOpen(_marketId)
    {
        require(msg.value > 0, "Invalid amount");

        userStakeInfoForAMkt[_marketId][msg.sender] = Stake({
            optionNo: uint8(_optionNo),
            amt: msg.value
        });

        if (_optionNo == 1) {
            markets[_marketId].totalStakedOpt1 += msg.value;
        } else if (_optionNo == 2) {
            markets[_marketId].totalStakedOpt2 += msg.value;
        } else if (_optionNo == 3) {
            markets[_marketId].totalStakedOpt3 += msg.value;
        }

        emit UserStaked(msg.sender, _marketId, _optionNo, msg.value);
    }

    /**
     * Resolve a market specifying the roundID of the aggregatorAddress
     * 
     * Contract will look up the timestamp of the roundID as a sanity check.
     * If it falls within a range of 3 min from the forecastTime,
     * the answer corr. to latest round ID is accepted.
     * 
     * @notice - 3 mins cuz in case of high gas price conditions,
     *         chainlink oracle updates to Aggregator might be slower
     * 
     * Beyond 3 minutes, the market is discarded
     * 
     * @param _marketId - 
     * @param _roundId  - RoundID of the Aggregator at which
     *                    the answer to the price forecast might be found
     **/
    function resolve(uint256 _marketId, uint256 _roundId)
        public
        marketToBeResolved(_marketId)
    {
        Market memory _market = markets[_marketId];

        uint256 timestamp = IAggregator(_market.aggregatorAddress).getTimestamp(
            _roundId
        );
        int256 price = IAggregator(_market.aggregatorAddress).getAnswer(
            _roundId
        );

        // Timestamp should be a max of +3 mins from forecastTime
        uint256 diff = timestamp - _market.forecastTime;

        // TODO: Handle in case diff is too large
        require(diff <= 3 minutes, "Diff too large");

        uint256 OPTION_START = 1;
        uint256 OPTION_END = 3;

        for (uint256 i = OPTION_START; i <= OPTION_END; i++) {
            OptionRange memory _range = optionInfoForMarket[_marketId][i];

            if (price >= _range.startPrice && price < _range.endPrice) {
                winningOptForMkt[_marketId] = i;
                break;
            }
        }

        markResolved(_marketId);
    }

    function updateMarketStateBasedOnTime(uint256 _marketId) internal {
        // Options not yet configured; Do not allow auto status changes
        if (markets[_marketId].optionsConfigured == false) {
            return;
        }

        if (block.timestamp < markets[_marketId].opensAt) {
            markets[_marketId].state = MarketState.CLOSED;
            return;
        } else if (
            block.timestamp >= markets[_marketId].opensAt &&
            block.timestamp <= markets[_marketId].closesAt
        ) {
            markets[_marketId].state = MarketState.OPEN;
            return;
        } else if (block.timestamp > markets[_marketId].closesAt) {
            markets[_marketId].state = MarketState.PENDING_RESOLUTION;
        }
    }

    function markResolved(uint256 _marketId) internal {
        markets[_marketId].state = MarketState.RESOLVED;
    }

    /**
     * Claim winnings if any 
     * 
     * @param _marketId - 
     **/
    function claimWinnings(uint256 _marketId) public {
        uint256 winAmt = getUserWinnings(_marketId, msg.sender);

        delete userStakeInfoForAMkt[_marketId][msg.sender];
        
        if(winAmt > 0) {
            msg.sender.transfer(winAmt);
        }
    }
    
    /**
     * @dev This fn. is only needed to handle special cases
     * 
     * For e.g., in a market when every bidder chooses the wrong option,
     *           ETH is basically stuck in the Contract
     *           As of now, devs can claim this
     **/
    function withdraw() public onlyOwner {
        msg.sender.transfer(address(this).balance);
    }

    /**
     * -------------------------------------
     * -------------------------------------
     *              VIEW FNS.
     * -------------------------------------
     **/

    function getMarketState(uint256 _marketId)
        public
        view
        returns (MarketState _state)
    {
        Market memory _market = markets[_marketId];
        _state = _market.state;
        
        if(_market.state == MarketState.RESOLVED) {
            return _market.state;
        }

        // Check/Reflect correct state based on time
        // Options not yet configured;
        if (_market.optionsConfigured == false) {
            return _state;
        }

        if (block.timestamp < _market.opensAt) {
            _state = MarketState.CLOSED;
        } else if (
            block.timestamp >= _market.opensAt &&
            block.timestamp <= _market.closesAt
        ) {
            _state = MarketState.OPEN;
        } else if (block.timestamp > _market.closesAt) {
            _state = MarketState.PENDING_RESOLUTION;
        }
    }

    /**
     * Get possible winnings of an user
     **/
    function getUserWinnings(uint256 _marketId, address _user)
        public
        view
        returns (uint256 _userShare)
    {
        Market memory _market = markets[_marketId];

        if(_market.state != MarketState.RESOLVED) {
            revert("Market not yet resolved");
        }
        
        uint256 winningOpt = winningOptForMkt[_marketId];

        (
            ,
            uint256 _totalStakedOpt1,
            uint256 _totalStakedOpt2,
            uint256 _totalStakedOpt3,
            ,
            ,

        ) = getMarket(_marketId);
        uint256 totalStaked = _totalStakedOpt1 +
            _totalStakedOpt2 +
            _totalStakedOpt3;

        (uint256 _userOptionNo, uint256 _userStakedAmt) = getUserStake(
            _marketId,
            _user
        );

        // user is not winner
        if (winningOpt != _userOptionNo) {
            return 0;
        }

        if (winningOpt == 1) {
            _userShare = (totalStaked * _totalStakedOpt1) / _userStakedAmt;
        } else if (winningOpt == 2) {
            _userShare = (totalStaked * _totalStakedOpt2) / _userStakedAmt;
        } else if (winningOpt == 3) {
            _userShare = (totalStaked * _totalStakedOpt3) / _userStakedAmt;
        }
    }

    /**
     * Get user stake details
     **/
    function getUserStake(uint256 _marketId, address _user)
        public
        view
        returns (uint256 _optionNo, uint256 _amt)
    {
        Stake memory _stake = userStakeInfoForAMkt[_marketId][_user];
        _optionNo = _stake.optionNo;
        _amt = _stake.amt;
    }

    /**
     * Get market details
     **/
    function getMarket(uint256 _marketId)
        public
        view
        returns (
            address _aggregatorAddress,
            uint256 _totalStakedOpt1,
            uint256 _totalStakedOpt2,
            uint256 _totalStakedOpt3,
            uint256 _opensAt,
            uint256 _closesAt,
            uint256 _forecastTime
        )
    {
        Market memory _market = markets[_marketId];
        _aggregatorAddress = _market.aggregatorAddress;
        _totalStakedOpt1 = _market.totalStakedOpt1;
        _totalStakedOpt2 = _market.totalStakedOpt2;
        _totalStakedOpt3 = _market.totalStakedOpt3;
        _opensAt = _market.opensAt;
        _closesAt = _market.closesAt;
        _forecastTime = _market.forecastTime;
    }

    /**
     * Get market pair details
     **/
    function getMarketPairs(uint256 _marketId)
        public
        view
        returns (bytes32 _fromToken, bytes32 _toToken)
    {
        Market memory _market = markets[_marketId];
        _fromToken = _market.fromToken;
        _toToken = _market.toToken;
    }

    /**
     * Get option ranges for a given market
     **/
    function getOptionInfo(uint256 _marketId, uint256 _optionNo)
        public
        view
        returns (int256, int256)
    {

            OptionRange memory _optionRange
         = optionInfoForMarket[_marketId][_optionNo];
        return (_optionRange.startPrice, _optionRange.endPrice);
    }
}

/**
 * Interface to Chainlink aggregator
 **/
interface IAggregator {
    function latestAnswer() external view returns (int256);

    /**
     * @notice get the last updated at block timestamp
     */
    function latestTimestamp() external view returns (uint256);

    function getAnswer(uint256 _roundId) external view returns (int256);

    /**
     * @notice get block timestamp when an answer was last updated
     * @param _roundId the answer number to retrieve the updated timestamp for
     */
    function getTimestamp(uint256 _roundId) external view returns (uint256);
}
