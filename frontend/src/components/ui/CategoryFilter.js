import React from 'react';
import { useCategoryStore } from '../../stores/useCategoryStore';

export default function CategoryFilter() {
  const { tree, selectedParent, selectedChild, selectParent, selectChild } = useCategoryStore();

  return (
    <div className="space-y-2">
      {/* 전체 */}
      <div className="flex items-center">
        <input
          id="category-all"
          type="radio"
          name="category"
          checked={selectedParent === undefined}
          onChange={() => selectParent(undefined)}
          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
        />
        <label htmlFor="category-all" className="ml-3 text-sm text-gray-700">
          전체
        </label>
      </div>

      {tree.map((parent) => (
        <div key={parent.id} className="space-y-1">
          <div className="flex items-center">
            <input
              id={`category-parent-${parent.id}`}
              type="radio"
              name="category"
              checked={selectedParent === parent.id && selectedChild === undefined}
              onChange={() => selectParent(parent.id)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
            />
            <label htmlFor={`category-parent-${parent.id}`} className="ml-3 text-sm text-gray-700">
              {parent.name}
            </label>
          </div>

          {/* 자식 목록 (접힘/펼침) */}
          {selectedParent === parent.id && parent.children.length > 0 && (
            <div className="ml-6 space-y-1">
              {parent.children.map((child) => (
                <div key={child.id} className="flex items-center">
                  <input
                    id={`category-child-${child.id}`}
                    type="radio"
                    name="category"
                    checked={selectedChild === child.id}
                    onChange={() => selectChild(child.id)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <label htmlFor={`category-child-${child.id}`} className="ml-3 text-sm text-gray-700">
                    {child.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}