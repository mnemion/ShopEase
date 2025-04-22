import React from 'react';
import PropTypes from 'prop-types';
import Card from './Card';
import Button from './Button';

const AddressCard = ({ address, onEdit, onDelete, onSetDefault, isProcessing }) => {
  return (
    <Card className="mb-4 relative">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center mb-1">
            <span className="font-semibold text-lg mr-2">{address.label || '배송지'}</span>
            {address.is_default && (
              <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded ml-1">기본</span>
            )}
          </div>
          <div className="text-sm text-gray-700 mb-1">{address.recipient} | {address.phone}</div>
          <div className="text-sm text-gray-600 mb-1">[{address.zip_code}] {address.address1} {address.address2}</div>
        </div>
        <div className="flex flex-col gap-2 items-end ml-4">
          {!address.is_default && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSetDefault(address.id)}
              isLoading={isProcessing === 'setDefault'}
            >
              기본설정
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(address)}
            disabled={isProcessing === 'edit'}
          >
            수정
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(address.id)}
            isLoading={isProcessing === 'delete'}
          >
            삭제
          </Button>
        </div>
      </div>
    </Card>
  );
};

AddressCard.propTypes = {
  address: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSetDefault: PropTypes.func.isRequired,
  isProcessing: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]),
};

export default AddressCard;