import React, { useState, useEffect } from "react";
import web3 from './web3';
import lottery from './lottery';
import './App.css';

function Lottery() {
  const [items, setItems] = useState([]);
  const [owners, setOwners] = useState([])
  const [currentAccount, setCurrentAccount] = useState("0x000");
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [eventListenerSet, setEventListenerSet] = useState(false);
  const [providerError, setProviderError] = useState(false);
  const [accessError, setAccessError] = useState(false);
  const [contractBalance, setContractBalance] = useState('');
  const { isAddress } = require('web3-validator');
  const [winnersDeclared, setWinnersDeclared] = useState(false)

  const images = [
    'https://www.kbb.com/wp-content/uploads/2022/06/Tesla-model-3-left.jpg?w=918',
    'https://hiraoka.com.pe/media/mageplaza/blog/post/m/a/macbook_air_vs._macbook_pro-_cuales_son_sus_diferencias.jpg',
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-blacktitanium?wid=2560&hei=1440&fmt=p-jpg&qlt=80&.v=1692845694698'
  ];

  const itemName = [
    'car',
    'laptop',
    'smartphone'
  ];
  
  useEffect(() => {

    loadWeb3()
    
    const interval = setInterval(() => {
      getItems();
      getOwners();
      getContractBalance();
      getWinnersDeclaredStatus();
    }, 4000);
    return () => clearInterval(interval);

  }, []);

  const loadWeb3 = async () => {

    if (window.ethereum) {

      if (!eventListenerSet) {
        setupEventListener();
        setEventListenerSet(true)
      }

      try {
        setAccessError(false)
        const account = web3.utils.toChecksumAddress((await window.ethereum.request({ method: 'eth_requestAccounts' }))[0]);
        setCurrentAccount(account);
        getItems()
        getOwners()
        getContractBalance()
        getWinnersDeclaredStatus()
      } catch (error) {
        setAccessError(true)
      }

    } else {
      setProviderError(true)
    }
  }

  const getItems = async () => {
    const itemsFromContract = await lottery.methods.getItems().call();
    setItems(itemsFromContract);
  };

  const getWinnersDeclaredStatus = async () => {
    const status = await lottery.methods.getWinnersDeclaredStatus().call();
    setWinnersDeclared(status)
  }

  function setupEventListener() {
    window.ethereum.on('accountsChanged', (accounts) => {
      const account =  web3.utils.toChecksumAddress(accounts[0]);
      setCurrentAccount(account);
    });
  }

  const getOwners = async () => {
    const ownersFromContract = await lottery.methods.getOwners().call();
    setOwners(ownersFromContract)
  }

  const Items = () => {
    return (
      <div className="itemsContainer">
        {items.map((item, index) => (
          <div key={index} className="itemContainer">
            <div class="itemTitle">{index+1}. a brand new {itemName[index]}</div>
            <div className="itemImageContainer">
              <img src={images[item.itemId.toString()]} alt={`Item ${item.itemId.toString()}`} className="itemImage"/>
            </div>
            {!owners.includes(currentAccount) && !winnersDeclared && (
              <button className="bidButton" onClick={() => bid(item.itemId.toString())}>bid here!</button>
            )}
            <label className="itemLabel">total bids: {item.itemTokens ? item.itemTokens.length : 0}</label>
          </div>
        ))}
      </div>
    );
  }

  const bid = async (itemID) => {
    lottery.methods.bid(itemID).send({
      from: currentAccount,
      value: web3.utils.toWei("0.01", "ether"),
        gasLimit: 1000000,
      })
      .then((res) => {
        console.log(res);
        getItems()
        getContractBalance()
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const getContractBalance = async () => {
    await web3.eth.getBalance(lottery.options.address)
      .then(balance => {
        const balanceInEther = web3.utils.fromWei(balance, 'ether');
        setContractBalance(balanceInEther)
      })
      .catch(error => console.error("Error getting balance:", error));
  }
  
  const handleChange = (event) => {
    setNewOwnerAddress(event.target.value);
  };

  const handleTransferOwnership = async () => {

    if (isAddress(newOwnerAddress)) {
      await lottery.methods.transferOwnership(newOwnerAddress)
      .send({ from: currentAccount })
      .then((res) => {
        console.log(res);
        getOwners()
      })
      .catch((err) => {
        console.log(err);
      });
    }
    else {
      alert("this is not a valid address");
    }
  }

  const handleWithdraw = async () => {
    await lottery.methods.withdraw()
      .send({ from: currentAccount })
      .then((res) => {
        console.log(res);
        getContractBalance()
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const handleReset = async () => {
    await lottery.methods.reset()
      .send({ from: currentAccount })
      .then((res) => {
        console.log(res);
        getItems()
        setWinnersDeclared(false)
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const handleDestroy = async () => {
    await lottery.methods.selfDestruct()
      .send({ from: currentAccount })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const handleCheckWinner = async () => {
    let won = false
    for (let i = 0; i < items.length; i++) {
      if (currentAccount === web3.utils.toChecksumAddress(items[i].winner)) {
        won = true
        alert("congratulations, you have won a brand new " + itemName[i]);
      }
    }

    if (!won) {
      alert("unfortunately you didnt win anything this time...");
    }
  }

  const handleDeclareWinners = async () => {
    await lottery.methods.declareWinners()
      .send({ from: currentAccount })
      .then((res) => {
        console.log(res);
        setWinnersDeclared(true)
        getItems()
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <div className="mainContainer">
      { providerError && (
        <div className="headerContainer">
          <h2 className="headerTitle">metamask is not installed...</h2>
          <h2 className="headerTitle">please install metamask and reload the page...</h2>
        </div>
      )}
      { accessError && (
        <div className="headerContainer">
          <h2 className="headerTitle">there was an error connecting with metamask...</h2>
        </div>
      )}
      {!providerError && !accessError && (
      <>
        <div className="headerContainer">
          <h1 className="headerTitle">your chance to win_ </h1>
        </div>
        <div>
          <Items/>
        </div>
        <div className="bottomContainer">
          <div className="bottomLeftContainer">
            <label className="addressLabel">current address:</label>
            <label className="addressLabel">{ currentAccount }</label>
          {!owners.includes(currentAccount) && winnersDeclared && (
            <button className="button" onClick={handleCheckWinner}>did i win?</button>
          )}
          </div>
          <div className="bottomLeftContainer">
            <label className="addressLabel">contract balance: {contractBalance}</label>
          </div>
          <div className="bottomRightContainer">
            <label className="addressLabel">owners addresses:</label>
            {owners.map((owner) => (
              <label className="addressLabel">{owner}</label>
            ))}
            {owners.includes(currentAccount) && (
            <>
              <div className="rightInnerContainer">
                <button className="button" onClick={handleDeclareWinners}>declare winners</button>
                <button className="button" onClick={handleWithdraw}>withdraw</button>
                <button className="button" onClick={handleReset}>reset</button>
                <button className="button" onClick={handleTransferOwnership}>transfer ownership</button>
                <button className="button" onClick={handleDestroy}>destroy</button>
              </div>
              <input
                className="inputField"
                type="text"
                value={newOwnerAddress}
                onChange={handleChange}
                placeholder="Enter new owner's wallet address"
              />
            </>
            )}
          </div>
        </div>
      </>
      )}
    </div>
  );
}

export default Lottery;
