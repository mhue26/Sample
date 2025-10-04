"use client";

import { useState } from "react";
import RelationshipField from "./RelationshipField";

interface AlternativeContact {
  method: string;
  details: string;
}

interface ParentInformationClientProps {
  student: {
    parentName: string | null;
    parentEmail: string | null;
    parentPhone: string | null;
  };
  parentContactInfo: {
    method: string;
    details: string;
  };
  parentRelationship: string;
  isOtherRelationship: boolean;
  otherRelationship: string;
  initialAlternativeContacts?: AlternativeContact[];
}

export default function ParentInformationClient({ 
  student, 
  parentContactInfo, 
  parentRelationship, 
  isOtherRelationship, 
  otherRelationship,
  initialAlternativeContacts = []
}: ParentInformationClientProps) {
  const [selectedRelationship, setSelectedRelationship] = useState(
    isOtherRelationship ? "Other" : parentRelationship
  );
  const [alternativeContacts, setAlternativeContacts] = useState<AlternativeContact[]>(initialAlternativeContacts);

  const showParentFields = selectedRelationship !== "N/A";

  const addAlternativeContact = () => {
    setAlternativeContacts([...alternativeContacts, { method: '', details: '' }]);
  };

  const removeAlternativeContact = (index: number) => {
    setAlternativeContacts(alternativeContacts.filter((_, i) => i !== index));
  };

  const updateAlternativeContact = (index: number, field: 'method' | 'details', value: string) => {
    const updated = alternativeContacts.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    );
    setAlternativeContacts(updated);
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Parent Information</h3>
      <div className="space-y-4">
        <RelationshipField 
          defaultValue={isOtherRelationship ? "Other" : parentRelationship}
          otherValue={otherRelationship}
          onRelationshipChange={setSelectedRelationship}
        />
        
        {showParentFields && (
          <>
            <label className="block">
              <div className="text-sm text-gray-700">Name</div>
              <input 
                name="parentName" 
                defaultValue={student.parentName || ""}
                className="mt-1 w-full border rounded-md px-3 py-2" 
              />
            </label>
            <div>
              <div className="text-sm text-gray-700 mb-3">Preferred Contact</div>
              <div className="flex gap-2">
                <select 
                  name="parentContactMethod"
                  defaultValue={parentContactInfo.method}
                  className="flex-1 border rounded-md px-3 py-2"
                >
                  <option value="">Select method</option>
                  <option value="Phone">Phone</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                  <option value="WeChat">WeChat</option>
                </select>
                <input 
                  name="parentContactDetails"
                  defaultValue={parentContactInfo.details}
                  placeholder="Enter contact details"
                  className="flex-1 border rounded-md px-3 py-2" 
                />
              </div>
            </div>

            {/* Alternative Contact Methods */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Alternative Contact</h4>
                <button 
                  type="button"
                  onClick={addAlternativeContact}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add another alternative contact
                </button>
              </div>
              
              {alternativeContacts.map((contact, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    name={`alternativeContactMethod-${index}`}
                    value={contact.method}
                    onChange={(e) => updateAlternativeContact(index, 'method', e.target.value)}
                    className="flex-1 border rounded-md px-3 py-2"
                  >
                    <option value="">Select method</option>
                    <option value="Phone">Phone</option>
                    <option value="Email">Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="WeChat">WeChat</option>
                  </select>
                  <input
                    name={`alternativeContactDetails-${index}`}
                    value={contact.details}
                    onChange={(e) => updateAlternativeContact(index, 'details', e.target.value)}
                    placeholder="Enter contact details"
                    className="flex-1 border rounded-md px-3 py-2"
                  />
                  <button 
                    type="button" 
                    onClick={() => removeAlternativeContact(index)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
