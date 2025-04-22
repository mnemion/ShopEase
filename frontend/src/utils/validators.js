/**
 * 이메일 유효성 검사
 * @param {string} email - 검사할 이메일
 * @returns {boolean} 유효성 여부
 */
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * 비밀번호 유효성 검사 (최소 8자, 최소 하나의 문자와 숫자)
   * @param {string} password - 검사할 비밀번호
   * @returns {boolean} 유효성 여부
   */
  export const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };
  
  /**
   * 전화번호 유효성 검사 (한국 전화번호 형식)
   * @param {string} phone - 검사할 전화번호
   * @returns {boolean} 유효성 여부
   */
  export const validatePhone = (phone) => {
    // 한국 전화번호 검증 (예: 01012345678 또는 010-1234-5678)
    const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
    return phoneRegex.test(phone);
  };
  
  /**
   * 우편번호 유효성 검사 (한국 우편번호 형식)
   * @param {string} zipCode - 검사할 우편번호
   * @returns {boolean} 유효성 여부
   */
  export const validateZipCode = (zipCode) => {
    // 한국 우편번호 검증 (5자리)
    const zipCodeRegex = /^\d{5}$/;
    return zipCodeRegex.test(zipCode);
  };
  
  /**
   * 필수 입력 필드 유효성 검사
   * @param {string} value - 검사할 값
   * @returns {boolean} 유효성 여부
   */
  export const validateRequired = (value) => {
    return value !== null && value !== undefined && value.trim() !== '';
  };
  
  /**
   * 숫자 범위 유효성 검사
   * @param {number} value - 검사할 값
   * @param {number} min - 최소값
   * @param {number} max - 최대값
   * @returns {boolean} 유효성 여부
   */
  export const validateNumberRange = (value, min, max) => {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  };
  
  /**
   * 폼 필드 유효성 검사 결과 반환
   * @param {string} value - 필드 값
   * @param {Array} validations - 적용할 유효성 검사 규칙 배열
   * @returns {Object} { isValid, error } 형식의 결과 객체
   */
  export const validateField = (value, validations) => {
    for (const validation of validations) {
      const { validator, errorMessage } = validation;
      
      if (!validator(value)) {
        return {
          isValid: false,
          error: errorMessage
        };
      }
    }
    
    return {
      isValid: true,
      error: null
    };
  };