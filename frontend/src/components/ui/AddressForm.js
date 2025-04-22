import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';

const defaultForm = {
  label: '',
  recipient: '',
  phone: '',
  zip_code: '',
  address1: '',
  address2: '',
  is_default: false,
};

const AddressForm = ({ initialData, onSubmit, onCancel, isLoading, errors }) => {
  const [form, setForm] = useState(initialData || defaultForm);

  // Daum 우편번호 연동
  const openDaumPostcode = () => {
    if (!window.daum?.Postcode) {
      alert('Daum 우편번호 서비스를 불러올 수 없습니다.');
      return;
    }
    new window.daum.Postcode({
      oncomplete: function(data) {
        let fullAddress = data.address;
        let extraAddress = '';
        if (data.addressType === 'R') {
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraAddress += data.bname;
          }
          if (data.buildingName !== '' && data.apartment === 'Y') {
            extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          fullAddress += (extraAddress !== '' ? ' (' + extraAddress + ')' : '');
        }
        setForm(prev => ({
          ...prev,
          zip_code: data.zonecode,
          address1: fullAddress,
          address2: '',
        }));
        setTimeout(() => {
          document.getElementById('address2')?.focus();
        }, 100);
      }
    }).open();
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium mb-1">배송지명 <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="label"
          value={form.label}
          onChange={handleChange}
          className="input w-full"
          required
        />
        {errors?.label && <div className="text-red-500 text-sm mt-1">{errors.label}</div>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">수령인 <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="recipient"
            value={form.recipient}
            onChange={handleChange}
            className="input w-full"
            required
          />
          {errors?.recipient && <div className="text-red-500 text-sm mt-1">{errors.recipient}</div>}
        </div>
        <div>
          <label className="block font-medium mb-1">연락처 <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="input w-full"
            required
          />
          {errors?.phone && <div className="text-red-500 text-sm mt-1">{errors.phone}</div>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 items-end">
        <div className="col-span-1">
          <label className="block font-medium mb-1">우편번호 <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="zip_code"
            value={form.zip_code}
            onChange={handleChange}
            className="input w-full"
            required
            readOnly
          />
        </div>
        <div className="col-span-1">
          <Button type="button" variant="outline" onClick={openDaumPostcode}>
            우편번호 찾기
          </Button>
        </div>
        <div className="col-span-1" />
      </div>
      {errors?.zip_code && <div className="text-red-500 text-sm mt-1">{errors.zip_code}</div>}
      <div>
        <label className="block font-medium mb-1">기본주소 <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="address1"
          value={form.address1}
          onChange={handleChange}
          className="input w-full"
          required
          readOnly
        />
        {errors?.address1 && <div className="text-red-500 text-sm mt-1">{errors.address1}</div>}
      </div>
      <div>
        <label className="block font-medium mb-1">상세주소 <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="address2"
          id="address2"
          value={form.address2}
          onChange={handleChange}
          className="input w-full"
          required
        />
        {errors?.address2 && <div className="text-red-500 text-sm mt-1">{errors.address2}</div>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_default"
          checked={form.is_default}
          onChange={handleChange}
          id="is_default"
        />
        <label htmlFor="is_default" className="text-sm">기본 배송지로 설정</label>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          취소
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          저장
        </Button>
      </div>
    </form>
  );
};

AddressForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  errors: PropTypes.object,
};

export default AddressForm;