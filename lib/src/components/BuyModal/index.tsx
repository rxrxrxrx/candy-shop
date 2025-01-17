import { BN } from '@project-serum/anchor';
import { web3 } from '@project-serum/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import Modal from 'components/Modal';
import Processing from 'components/Processing';
import { CandyShop } from '@liqnft/candy-shop-sdk';
import React, { useState } from 'react';
import { Order as OrderSchema } from 'solana-candy-shop-schema/dist';
import { ErrorMsgMap, ErrorType, handleError } from 'utils/ErrorHandler';
import { notification, NotificationType } from 'utils/rc-notification';
import { TransactionState } from '../../model';
import BuyModalConfirmed from './BuyModalConfirmed';
import BuyModalDetail from './BuyModalDetail';
import './style.less';

export interface BuyModalProps {
  order: OrderSchema;
  onClose: any;
  wallet: AnchorWallet | undefined;
  candyShop: CandyShop;
  walletConnectComponent: React.ReactElement;
}

export const BuyModal: React.FC<BuyModalProps> = ({
  order,
  onClose,
  wallet,
  candyShop,
  walletConnectComponent,
}) => {
  const [state, setState] = useState<TransactionState>(
    TransactionState.DISPLAY
  );

  const [hash, setHash] = useState(''); // txHash

  const buy = async () => {
    if (!wallet) {
      notification(
        ErrorMsgMap[ErrorType.InvalidWallet],
        NotificationType.Error
      );
      return;
    }
    setState(TransactionState.PROCESSING);
    return candyShop
      .buy(
        new web3.PublicKey(order.walletAddress),
        new web3.PublicKey(order.tokenAccount),
        new web3.PublicKey(order.tokenMint),
        new BN(order.price),
        wallet
      )
      .then((txHash) => {
        setHash(txHash);
        console.log('Buy order made with transaction hash', txHash);

        setState(TransactionState.CONFIRMED);
      })
      .catch((err) => {
        console.log({ err });
        handleError(ErrorType.TransactionFailed);
        setState(TransactionState.DISPLAY);
      });
  };

  return (
    <>
      <Modal
        onCancel={onClose}
        width={state !== TransactionState.DISPLAY ? 600 : 1000}
      >
        <div className="buy-modal">
          {state === TransactionState.DISPLAY && (
            <BuyModalDetail
              order={order}
              buy={buy}
              walletPublicKey={wallet?.publicKey}
              walletConnectComponent={walletConnectComponent}
              candyShop={candyShop}
            />
          )}
          {state === TransactionState.PROCESSING && (
            <Processing text="Processing purchase" />
          )}
          {state === TransactionState.CONFIRMED && wallet && (
            <BuyModalConfirmed
              walletPublicKey={wallet.publicKey}
              order={order}
              txHash={hash}
              candyShop={candyShop}
            />
          )}
        </div>
      </Modal>
    </>
  );
};
