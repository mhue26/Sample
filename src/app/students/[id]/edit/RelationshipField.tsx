"use client";

import { useState } from "react";

interface RelationshipFieldProps {
  defaultValue: string;
  otherValue?: string;
  onRelationshipChange?: (relationship: string) => void;
}

export default function RelationshipField({ defaultValue, otherValue, onRelationshipChange }: RelationshipFieldProps) {
  const [selectedRelationship, setSelectedRelationship] = useState(defaultValue);
  const [otherText, setOtherText] = useState(otherValue || "");

  const handleRelationshipChange = (value: string) => {
    setSelectedRelationship(value);
    onRelationshipChange?.(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <label className="flex-1">
          <div className="text-sm text-gray-700">Relationship</div>
          <select 
            name="parentRelationship"
            value={selectedRelationship}
            onChange={(e) => handleRelationshipChange(e.target.value)}
            className="mt-1 w-full border rounded-md px-3 py-2"
          >
            <option value="">Select relationship</option>
            <option value="Mother">Mother</option>
            <option value="Father">Father</option>
            <option value="Other">Other</option>
            <option value="N/A">N/A</option>
          </select>
        </label>
        
        {selectedRelationship === "Other" && (
          <label className="flex-1">
            <div className="text-sm text-gray-700">Specify relationship</div>
            <input 
              name="parentRelationshipOther"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Enter relationship (e.g., Grandmother, Guardian, etc.)"
              className="mt-1 w-full border rounded-md px-3 py-2" 
            />
          </label>
        )}
      </div>
    </div>
  );
}
