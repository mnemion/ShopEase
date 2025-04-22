import React, { useState, useEffect, useReducer } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, getAddresses, addAddress, updateAddress, deleteAddress } from '../api/auth';
import { validateRequired, validatePhone, validateZipCode } from '../utils/validators';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { toast } from 'react-toastify';
import AddressCard from '../components/ui/AddressCard';
import AddressForm from '../components/ui/AddressForm';
import Modal from '../components/ui/Modal';

const addressInitialState = {
  addresses: [],
  showAddressModal: false,
  editingAddress: null,
  addressFormErrors: {},
  addressProcessingId: null,
  isSavingAddress: false,
};

function addressReducer(state, action) {
  switch (action.type) {
    case 'LOAD_ADDRESSES':
      return { ...state, addresses: action.addresses };
    case 'OPEN_MODAL':
      return { ...state, showAddressModal: true, editingAddress: action.editingAddress || null, addressFormErrors: {} };
    case 'CLOSE_MODAL':
      return { ...state, showAddressModal: false, editingAddress: null, addressFormErrors: {} };
    case 'SET_FORM_ERRORS':
      return { ...state, addressFormErrors: action.errors };
    case 'SET_PROCESSING':
      return { ...state, addressProcessingId: action.id };
    case 'SET_SAVING':
      return { ...state, isSavingAddress: action.value };
    case 'ADD_ADDRESS':
      return { ...state, addresses: [...state.addresses, action.address] };
    case 'UPDATE_ADDRESS':
      return { ...state, addresses: state.addresses.map(addr => addr.id === action.address.id ? action.address : addr) };
    case 'DELETE_ADDRESS':
      return { ...state, addresses: state.addresses.filter(addr => addr.id !== action.id) };
    case 'SET_DEFAULT_ADDRESS':
      return {
        ...state,
        addresses: state.addresses.map(addr =>
          addr.id === action.id ? { ...addr, is_default: true } : { ...addr, is_default: false }
        ),
      };
    default:
      return state;
  }
}

const Profile = () => {
  const { user, updateUserInfo } = useAuth();
  
  // 프로필 상태
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  
  // 배송지 상태
  const [addressState, addressDispatch] = useReducer(addressReducer, addressInitialState);
  
  // 로딩 상태
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // 에러 상태
  const [profileErrors, setProfileErrors] = useState({});
  
  // 프로필 정보 로드
  useEffect(() => {
    const fetchProfile = async () => {
      setIsProfileLoading(true);
      
      try {
        const data = await getProfile();
        setProfileData({
          name: data.name || '',
          phone: data.phone || '',
        });
      } catch (error) {
        console.error('프로필 로드 실패:', error);
        toast.error('프로필 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsProfileLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  // 배송지 정보 로드
  useEffect(() => {
    if (!user) return; // user가 세팅된 후에만 실행
    const fetchAddresses = async () => {
      setIsAddressLoading(true);
      try {
        const response = await getAddresses();
        addressDispatch({ type: 'LOAD_ADDRESSES', addresses: response.results || [] });
      } catch (error) {
        console.error('배송지 로드 실패:', error);
        toast.error('배송지 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsAddressLoading(false);
      }
    };
    fetchAddresses();
  }, [user]);
  
  // 프로필 폼 입력 핸들러
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
    
    // 에러 초기화
    if (profileErrors[name]) {
      setProfileErrors({
        ...profileErrors,
        [name]: '',
      });
    }
  };
  
  // 배송지 추가 버튼 클릭
  const handleAddAddressClick = () => {
    addressDispatch({ type: 'OPEN_MODAL' });
  };
  
  // 배송지 수정 버튼 클릭
  const handleEditAddress = (address) => {
    addressDispatch({ type: 'OPEN_MODAL', editingAddress: address });
  };
  
  // 배송지 삭제
  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('이 배송지를 삭제하시겠습니까?')) return;
    addressDispatch({ type: 'SET_PROCESSING', id: addressId + '-delete' });
    try {
      await deleteAddress(addressId);
      addressDispatch({ type: 'DELETE_ADDRESS', id: addressId });
      toast.success('배송지가 삭제되었습니다.');
      if (addressState.editingAddress && addressState.editingAddress.id === addressId) {
        addressDispatch({ type: 'CLOSE_MODAL' });
      }
    } catch (error) {
      toast.error('배송지 삭제에 실패했습니다.');
    } finally {
      addressDispatch({ type: 'SET_PROCESSING', id: null });
    }
  };
  
  // 기본 배송지 설정
  const handleSetDefaultAddress = async (addressId) => {
    addressDispatch({ type: 'SET_PROCESSING', id: addressId + '-setDefault' });
    try {
      const updated = await updateAddress(addressId, { is_default: true });
      addressDispatch({ type: 'SET_DEFAULT_ADDRESS', id: addressId });
      toast.success('기본 배송지가 변경되었습니다.');
    } catch (error) {
      toast.error('기본 배송지 설정에 실패했습니다.');
    } finally {
      addressDispatch({ type: 'SET_PROCESSING', id: null });
    }
  };
  
  // 배송지 추가/수정 폼 제출
  const handleAddressFormSubmit = async (form) => {
    addressDispatch({ type: 'SET_SAVING', value: true });
    addressDispatch({ type: 'SET_FORM_ERRORS', errors: {} });
    try {
      let updatedAddress;
      if (addressState.editingAddress) {
        updatedAddress = await updateAddress(addressState.editingAddress.id, form);
        addressDispatch({ type: 'UPDATE_ADDRESS', address: updatedAddress });
        toast.success('배송지가 수정되었습니다.');
      } else {
        updatedAddress = await addAddress(form);
        addressDispatch({ type: 'ADD_ADDRESS', address: updatedAddress });
        toast.success('새 배송지가 추가되었습니다.');
      }
      // 기본 배송지로 설정된 경우, 목록에서 반영
      if (updatedAddress.is_default) {
        addressDispatch({ type: 'SET_DEFAULT_ADDRESS', id: updatedAddress.id });
      }
      addressDispatch({ type: 'CLOSE_MODAL' });
    } catch (error) {
      if (error.response && error.response.data) {
        const fieldErrors = {};
        Object.entries(error.response.data).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value[0] : value;
        });
        addressDispatch({ type: 'SET_FORM_ERRORS', errors: fieldErrors });
      } else {
        toast.error('배송지 저장에 실패했습니다.');
      }
    } finally {
      addressDispatch({ type: 'SET_SAVING', value: false });
    }
  };
  
  // 배송지 추가/수정 모달 닫기
  const handleAddressModalClose = () => {
    addressDispatch({ type: 'CLOSE_MODAL' });
  };
  
  // 프로필 저장 핸들러
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    // 프로필 유효성 검증
    const errors = {};
    
    if (!validateRequired(profileData.name)) {
      errors.name = '이름을 입력해주세요.';
    }
    
    if (profileData.phone && !validatePhone(profileData.phone)) {
      errors.phone = '올바른 전화번호 형식이 아닙니다.';
    }
    
    setProfileErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setIsSavingProfile(true);
    
    try {
      const updatedProfile = await updateProfile(profileData);
      updateUserInfo(updatedProfile);
      toast.success('프로필이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      
      if (error.response && error.response.data) {
        // 필드별 에러 처리
        const fieldErrors = {};
        Object.entries(error.response.data).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value[0] : value;
        });
        
        if (Object.keys(fieldErrors).length > 0) {
          setProfileErrors(fieldErrors);
        } else {
          toast.error('프로필 저장에 실패했습니다.');
        }
      } else {
        toast.error('서버 연결에 문제가 있습니다.');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };
  
  // 로딩 중일 때
  if (isProfileLoading || isAddressLoading) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <Loading text="프로필 정보를 불러오는 중입니다..." />
      </div>
    );
  }
  
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* 프로필 정보 */}
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">내 정보</h2>
            <p className="mt-2 text-gray-600">
              계정 정보를 관리합니다.
            </p>
            
            <form onSubmit={handleSaveProfile} className="mt-6">
              <div className="max-w-3xl mx-auto bg-white shadow overflow-hidden rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-6 gap-6">
                    {/* 이메일 (읽기 전용) */}
                    <div className="col-span-6 sm:col-span-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        이메일
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={user?.email || ''}
                        readOnly
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">이메일은 변경할 수 없습니다.</p>
                    </div>
                    
                    {/* 이름 */}
                    <div className="col-span-6 sm:col-span-4">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        이름
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        className={`mt-1 block w-full border ${
                          profileErrors.name ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                      />
                      {profileErrors.name && (
                        <p className="mt-2 text-sm text-red-600">
                          {profileErrors.name}
                        </p>
                      )}
                    </div>
                    
                    {/* 전화번호 */}
                    <div className="col-span-6 sm:col-span-4">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        전화번호
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        placeholder="01012345678"
                        className={`mt-1 block w-full border ${
                          profileErrors.phone ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                      />
                      {profileErrors.phone ? (
                        <p className="mt-2 text-sm text-red-600">
                          {profileErrors.phone}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">
                          - 없이 숫자만 입력해주세요.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSavingProfile}
                  >
                    저장
                  </Button>
                </div>
              </div>
            </form>
          </div>
          
          {/* 배송지 관리 */}
          <div>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900">배송지 관리</h2>
                <p className="mt-2 text-gray-600">주문 시 사용할 배송지를 관리합니다.</p>
              </div>
              <Button onClick={handleAddAddressClick} variant="primary">새 배송지 추가</Button>
            </div>
            {/* 배송지 목록 */}
            <div className="mt-6 space-y-6">
              {addressState.addresses.length === 0 ? (
                <div className="bg-gray-50 p-6 text-center rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="mt-2 text-base font-medium text-gray-900">등록된 배송지가 없습니다</h3>
                  <p className="mt-1 text-sm text-gray-500">새 배송지를 추가해주세요.</p>
                </div>
              ) : (
                addressState.addresses.map(address => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    onEdit={handleEditAddress}
                    onDelete={handleDeleteAddress}
                    onSetDefault={handleSetDefaultAddress}
                    isProcessing={addressState.addressProcessingId && addressState.addressProcessingId.startsWith(address.id) ? addressState.addressProcessingId.split('-')[1] : false}
                  />
                ))
              )}
            </div>
            {/* 배송지 추가/수정 모달 */}
            <Modal
              isOpen={addressState.showAddressModal}
              onClose={handleAddressModalClose}
              title={addressState.editingAddress ? '배송지 수정' : '새 배송지 추가'}
            >
              <AddressForm
                initialData={addressState.editingAddress ? addressState.editingAddress : undefined}
                onSubmit={handleAddressFormSubmit}
                onCancel={handleAddressModalClose}
                isLoading={addressState.isSavingAddress}
                errors={addressState.addressFormErrors}
              />
            </Modal>
          </div>
          
          {/* 주문 내역 링크 */}
          <div className="text-center">
            <Link to="/orders">
              <Button variant="secondary">주문 내역 보기</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;