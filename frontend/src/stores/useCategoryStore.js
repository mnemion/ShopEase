import create from 'zustand';

// 카테고리 노드 타입 정의
/**
 * @typedef {Object} CategoryNode
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 * @property {CategoryNode[]} children
 */

// Zustand 스토어 생성
export const useCategoryStore = create((set) => ({
  tree: [],
  selectedParent: undefined,
  selectedChild: undefined,
  setTree: (tree) => set({ tree }),
  selectParent: (id) => set({ selectedParent: id, selectedChild: undefined }),
  selectChild: (id) => set({ selectedChild: id }),
}));