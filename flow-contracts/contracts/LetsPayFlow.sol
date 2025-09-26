// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract LetsPayFlow {
    address public owner;
    uint256 public escrowCount;
    uint256 public constant CREDIT_FLOW = 200 ether; // 200 FLOW tokens (assuming 1 FLOW = 1 ether unit)

    mapping(address => uint256) public credit;
    mapping(address => bool) public signedUp;
    enum EscrowStatus {
        CREATED,
        PAID,
        SETTLED,
        CANCELLED
    }

    struct Escrow {
        address host;
        address payable merchant;
        uint256 total;
        EscrowStatus status;
        address[] participants;
        uint256[] shares;
    }

    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => mapping(address => bool)) public accepted;

    event SignedUp(address indexed user, uint256 amount);
    event EscrowCreated(
        uint256 indexed id,
        address indexed host,
        address indexed merchant,
        uint256 total
    );
    event MerchantPaid(uint256 indexed id, address merchant, uint256 total);
    event ParticipantAccepted(
        uint256 indexed id,
        address participant,
        uint256 amount
    );
    event EscrowSettled(uint256 indexed id);
    event ContractFunded(address indexed from, uint256 amount);
    event CreditRepaid(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // fund the contract with native FLOW so it can pay merchants
    function fundContract() external payable {
        require(msg.value > 0, "no value");
        emit ContractFunded(msg.sender, msg.value);
    }

    // give user 200 FLOW credits 
    function signup() external {
        require(!signedUp[msg.sender], "already signed up");
        signedUp[msg.sender] = true;
        credit[msg.sender] = CREDIT_FLOW;
        emit SignedUp(msg.sender, CREDIT_FLOW);
    }

    // 1. deduct host credit by total
    // 2. pay merchant directly
    // 3. save escrow
    // 4. build participants array = host + others
    // 5. emit events
    // 6. return escrow id
    function createEscrow(
        address payable merchant,
        address[] calldata otherParticipants,
        uint256[] calldata otherShares,
        uint256 total
    ) external returns (uint256) {
        require(otherParticipants.length == otherShares.length, "len mismatch");

        // compute host share = total - sum(otherShares)
        uint256 sum = 0;
        for (uint i = 0; i < otherShares.length; i++) {
            sum += otherShares[i];
        }
        require(sum <= total, "shares too big");
        uint256 hostShare = total - sum;

        require(credit[msg.sender] >= hostShare, "insufficient host credit");

        // Deduct host credit by total
        credit[msg.sender] -= total;

        // Pay merchant directly
        require(address(this).balance >= total, "contract lacks funds");
        (bool ok, ) = merchant.call{value: total}("");
        require(ok, "merchant payment failed");

        // Save escrow
        escrowCount++;
        Escrow storage e = escrows[escrowCount];
        e.host = msg.sender;
        e.merchant = merchant;
        e.total = total;
        e.status = EscrowStatus.PAID;

        // Build participants array = host + others
        e.participants.push(msg.sender);
        e.shares.push(hostShare);
        for (uint i = 0; i < otherParticipants.length; i++) {
            e.participants.push(otherParticipants[i]);
            e.shares.push(otherShares[i]);
        }

        emit EscrowCreated(escrowCount, msg.sender, merchant, total);
        emit MerchantPaid(escrowCount, merchant, total);

        return escrowCount;
    }

    // 1. check if escrow is paid
    // 2. check if host is not the participant
    // 3. find the participant in the participants array
    // 4. check if the participant has not accepted yet
    // 5. deduct participant credit, reimburse host
    // 6. accept participant
    // 7. check if all participants have accepted
    // 8. set escrow status to settled
    // 9. emit events
    // 10. return escrow id
    function accept(uint256 escrowId) external {
        Escrow storage e = escrows[escrowId];
        require(e.status == EscrowStatus.PAID, "not payable");

        // Host should never need to accept
        require(msg.sender != e.host, "host auto-paid");

        uint idx = type(uint).max;
        for (uint i = 0; i < e.participants.length; i++) {
            if (e.participants[i] == msg.sender) {
                idx = i;
                break;
            }
        }
        require(idx != type(uint).max, "not participant");
        require(!accepted[escrowId][msg.sender], "already accepted");

        uint256 amount = e.shares[idx];
        require(credit[msg.sender] >= amount, "insufficient credit");

        // reduce participant credit, reimburse host
        credit[msg.sender] -= amount;
        credit[e.host] += amount;
        accepted[escrowId][msg.sender] = true;

        emit ParticipantAccepted(escrowId, msg.sender, amount);

        // check if all participants (excluding host) have accepted
        bool all = true;
        for (uint i = 0; i < e.participants.length; i++) {
            if (
                e.participants[i] != e.host &&
                !accepted[escrowId][e.participants[i]]
            ) {
                all = false;
                break;
            }
        }
        if (all) {
            e.status = EscrowStatus.SETTLED;
            emit EscrowSettled(escrowId);
        }
    }

    function cancelEscrow(uint256 escrowId) external {
        Escrow storage e = escrows[escrowId];
        require(msg.sender == e.host || msg.sender == owner, "not allowed");
        require(e.status == EscrowStatus.PAID, "wrong state");
        e.status = EscrowStatus.CANCELLED;
        credit[e.host] += e.total;
    }

    function getPendingEscrowsFor(
        address user
    ) external view returns (uint256[] memory) {
        uint256 cnt = 0;
        for (uint i = 1; i <= escrowCount; i++) {
            Escrow storage e = escrows[i];
            if (e.status == EscrowStatus.PAID) {
                for (uint j = 0; j < e.participants.length; j++) {
                    if (
                        e.participants[j] == user &&
                        e.participants[j] != e.host &&
                        !accepted[i][user]
                    ) {
                        cnt++;
                        break;
                    }
                }
            }
        }

        uint256[] memory ids = new uint256[](cnt);
        uint k = 0;
        for (uint i = 1; i <= escrowCount; i++) {
            Escrow storage e = escrows[i];
            if (e.status == EscrowStatus.PAID) {
                for (uint j = 0; j < e.participants.length; j++) {
                    if (
                        e.participants[j] == user &&
                        e.participants[j] != e.host &&
                        !accepted[i][user]
                    ) {
                        ids[k++] = i;
                        break;
                    }
                }
            }
        }
        return ids;
    }

    function escrowDetails(
        uint256 escrowId
    )
        external
        view
        returns (
            address host,
            address merchant,
            uint256 total,
            EscrowStatus status,
            address[] memory participants,
            uint256[] memory shares
        )
    {
        Escrow storage e = escrows[escrowId];
        return (
            e.host,
            e.merchant,
            e.total,
            e.status,
            e.participants,
            e.shares
        );
    }

    // get history of escrows for a user
    function getUserHistory(
        address user
    )
        external
        view
        returns (
            uint256[] memory ids,
            address[] memory hosts,
            address[] memory merchants,
            uint256[] memory totals,
            EscrowStatus[] memory statuses,
            address[][] memory participantsList,
            uint256[][] memory sharesList
        )
    {
        uint256 cnt = 0;
        for (uint i = 1; i <= escrowCount; i++) {
            Escrow storage e = escrows[i];
            if (e.host == user) {
                cnt++;
            } else {
                for (uint j = 0; j < e.participants.length; j++) {
                    if (e.participants[j] == user) {
                        cnt++;
                        break;
                    }
                }
            }
        }

        ids = new uint256[](cnt);
        hosts = new address[](cnt);
        merchants = new address[](cnt);
        totals = new uint256[](cnt);
        statuses = new EscrowStatus[](cnt);
        participantsList = new address[][](cnt);
        sharesList = new uint256[][](cnt);

        uint k = 0;
        for (uint i = 1; i <= escrowCount; i++) {
            Escrow storage e = escrows[i];
            bool involved = false;
            if (e.host == user) {
                involved = true;
            } else {
                for (uint j = 0; j < e.participants.length; j++) {
                    if (e.participants[j] == user) {
                        involved = true;
                        break;
                    }
                }
            }
            if (involved) {
                ids[k] = i;
                hosts[k] = e.host;
                merchants[k] = e.merchant;
                totals[k] = e.total;
                statuses[k] = e.status;
                participantsList[k] = e.participants;
                sharesList[k] = e.shares;
                k++;
            }
        }
    }

    function repayCredit() external payable {
        require(msg.value > 0, "no value");
        credit[msg.sender] += msg.value;
        emit CreditRepaid(msg.sender, msg.value);
    }

    // allow contract to receive FLOW
    receive() external payable {}
}
