"use client";

import React, { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { useStore } from "@/context/StoreContext";
import { Plus, Trash2, Tag, Layers, Palette, Pencil, X, Check } from "lucide-react";

export default function AdminAttributesPage() {
  const {
    lifestyleTags,
    addTag,
    updateTag,
    deleteTag,
    sizes,
    addSize,
    updateSize,
    deleteSize,
    colors,
    addColor,
    updateColor,
    deleteColor,
    showToast,
  } = useStore();

  const [newTag, setNewTag] = useState("");

  const [newSizeName, setNewSizeName] = useState("");
  const [newSizeCode, setNewSizeCode] = useState("");

  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#5E1A2D");

  // Editing state for each attribute type
  const [editingTag, setEditingTag] = useState<{ id: string; name: string } | null>(null);
  const [editingSize, setEditingSize] = useState<{ id: string; name: string; code: string } | null>(null);
  const [editingColor, setEditingColor] = useState<{ id: string; name: string; hex: string } | null>(null);

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    await addTag(newTag.trim());
    showToast({ type: "success", title: "Tag Added", message: `Added tag #${newTag.trim()}` });
    setNewTag("");
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !editingTag.name.trim()) return;
    await updateTag(editingTag.id, editingTag.name.trim());
    showToast({ type: "success", title: "Tag Updated", message: `Updated tag #${editingTag.name.trim()}` });
    setEditingTag(null);
  };

  const handleAddSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSizeName.trim() || !newSizeCode.trim()) return;
    await addSize(newSizeName.trim(), newSizeCode.trim());
    showToast({ type: "success", title: "Size Added", message: `Added size ${newSizeCode.trim()} (${newSizeName.trim()})` });
    setNewSizeName("");
    setNewSizeCode("");
  };

  const handleUpdateSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSize || !editingSize.name.trim() || !editingSize.code.trim()) return;
    await updateSize(editingSize.id, editingSize.name.trim(), editingSize.code.trim());
    showToast({ type: "success", title: "Size Updated", message: `Updated size ${editingSize.code.trim()} (${editingSize.name.trim()})` });
    setEditingSize(null);
  };

  const handleAddColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorName.trim()) return;
    await addColor(newColorName.trim(), newColorHex);
    showToast({ type: "success", title: "Color Added", message: `Added color ${newColorName.trim()}` });
    setNewColorName("");
  };

  const handleUpdateColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColor || !editingColor.name.trim()) return;
    await updateColor(editingColor.id, editingColor.name.trim(), editingColor.hex);
    showToast({ type: "success", title: "Color Updated", message: `Updated color ${editingColor.name.trim()}` });
    setEditingColor(null);
  };

  return (
    <div className="flex min-h-screen bg-ivory-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader title="Lifestyle Tags, Sizes & Colors Management" />

        <main className="p-4 sm:p-8 space-y-8">
          {/* SECTION 1: LIFESTYLE TAGS */}
          <div className="bg-ivory border border-ivory-300 p-6 space-y-6 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-ivory-300 pb-3">
              <Tag className="w-5 h-5 text-crimson" />
              <h2 className="font-serif text-xl text-ink uppercase">Lifestyle Tags <span className="font-sans font-bold">({lifestyleTags.length})</span></h2>
            </div>

            <form onSubmit={handleAddTag} className="flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                type="text"
                required
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g. Bridal, Festive, Partywear..."
                className="flex-1 border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none focus:border-crimson"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-crimson hover:bg-burgundy text-ivory text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>
            </form>

            <div className="flex flex-wrap gap-3 pt-2">
              {lifestyleTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center space-x-2 bg-ivory-200 border border-ivory-300 px-3 py-1.5 rounded text-xs transition-colors hover:border-gold"
                >
                  <span className="font-medium text-ink">#{tag.name}</span>
                  <div className="flex items-center space-x-1 ml-1.5 border-l border-ivory-300 pl-2">
                    <button
                      type="button"
                      onClick={() => setEditingTag({ id: tag.id, name: tag.name })}
                      className="text-gold-700 hover:text-gold p-0.5 transition-colors"
                      title={`Edit #${tag.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete tag "${tag.name}"?`)) {
                          deleteTag(tag.id);
                        }
                      }}
                      className="text-crimson hover:text-crimson-800 p-0.5 transition-colors"
                      title={`Delete #${tag.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: SIZES MANAGEMENT */}
          <div className="bg-ivory border border-ivory-300 p-6 space-y-6 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-ivory-300 pb-3">
              <Layers className="w-5 h-5 text-gold" />
              <h2 className="font-serif text-xl text-ink uppercase">Size Options <span className="font-sans font-bold">({sizes.length})</span></h2>
            </div>

            <form onSubmit={handleAddSize} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg">
              <input
                type="text"
                required
                value={newSizeName}
                onChange={(e) => setNewSizeName(e.target.value)}
                placeholder="Name (e.g. Medium)"
                className="border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none focus:border-gold"
              />
              <input
                type="text"
                required
                value={newSizeCode}
                onChange={(e) => setNewSizeCode(e.target.value)}
                placeholder="Code (e.g. M)"
                className="border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none focus:border-gold"
              />
              <button
                type="submit"
                className="py-2.5 bg-gold hover:bg-gold-600 text-ivory text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Size</span>
              </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {sizes.map((sz) => (
                <div
                  key={sz.id}
                  className="p-3 bg-ivory-200 border border-ivory-300 flex items-center justify-between text-xs transition-colors hover:border-gold"
                >
                  <div>
                    <span className="font-bold text-ink block">{sz.code}</span>
                    <span className="text-[10px] text-ink-muted">{sz.name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingSize({ id: sz.id, name: sz.name, code: sz.code })}
                      className="text-gold-700 hover:text-gold p-1 transition-colors"
                      title={`Edit size ${sz.code}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete size "${sz.code}"?`)) {
                          deleteSize(sz.id);
                        }
                      }}
                      className="text-crimson hover:text-crimson-800 p-1 transition-colors"
                      title={`Delete size ${sz.code}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: COLORS MANAGEMENT */}
          <div className="bg-ivory border border-ivory-300 p-6 space-y-6 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-ivory-300 pb-3">
              <Palette className="w-5 h-5 text-crimson" />
              <h2 className="font-serif text-xl text-ink uppercase">Color Palette Options <span className="font-sans font-bold">({colors.length})</span></h2>
            </div>

            <form onSubmit={handleAddColor} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg">
              <input
                type="text"
                required
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Color Name (e.g. Crimson Maroon)"
                className="border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none focus:border-crimson"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-10 h-10 border rounded cursor-pointer p-0"
                />
                <span className="text-xs font-mono text-ink">{newColorHex}</span>
              </div>
              <button
                type="submit"
                className="py-2.5 bg-crimson hover:bg-burgundy text-ivory text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Color</span>
              </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              {colors.map((col) => (
                <div
                  key={col.id}
                  className="p-3 bg-ivory-200 border border-ivory-300 flex items-center justify-between text-xs transition-colors hover:border-gold"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <div
                      className="w-5 h-5 rounded-full border border-gold flex-shrink-0"
                      style={{ backgroundColor: col.hex }}
                    />
                    <div className="truncate">
                      <span className="font-medium text-ink block truncate">{col.name}</span>
                      <span className="font-mono text-[10px] text-ink-muted">{col.hex}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => setEditingColor({ id: col.id, name: col.name, hex: col.hex })}
                      className="text-gold-700 hover:text-gold p-1 transition-colors"
                      title={`Edit ${col.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete color "${col.name}"?`)) {
                          deleteColor(col.id);
                        }
                      }}
                      className="text-crimson hover:text-crimson-800 p-1 transition-colors"
                      title={`Delete ${col.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* EDIT TAG MODAL */}
      {editingTag && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ivory border-2 border-gold/50 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-ivory-300 pb-3">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-crimson" />
                <h3 className="font-serif text-lg text-ink uppercase">Edit Lifestyle Tag</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTag(null)}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTag} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-ink-muted mb-1.5 font-medium">
                  Tag Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editingTag.name}
                  onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                  placeholder="e.g. Bridal, Festive, Silk"
                  className="w-full border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none focus:border-crimson bg-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-ivory-300">
                <button
                  type="button"
                  onClick={() => setEditingTag(null)}
                  className="px-4 py-2 border border-ivory-300 text-xs uppercase tracking-wider text-ink hover:bg-ivory-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-crimson hover:bg-burgundy text-ivory text-xs uppercase tracking-wider font-semibold shadow transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SIZE MODAL */}
      {editingSize && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ivory border-2 border-gold/50 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-ivory-300 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-gold" />
                <h3 className="font-serif text-lg text-ink uppercase">Edit Size Option</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSize(null)}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSize} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-ink-muted mb-1.5 font-medium">
                  Size Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editingSize.name}
                  onChange={(e) => setEditingSize({ ...editingSize, name: e.target.value })}
                  placeholder="e.g. Medium, Extra Large"
                  className="w-full border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none focus:border-gold bg-white"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-ink-muted mb-1.5 font-medium">
                  Size Code / Label
                </label>
                <input
                  type="text"
                  required
                  value={editingSize.code}
                  onChange={(e) => setEditingSize({ ...editingSize, code: e.target.value })}
                  placeholder="e.g. M, XL, Free Size"
                  className="w-full border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none focus:border-gold bg-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-ivory-300">
                <button
                  type="button"
                  onClick={() => setEditingSize(null)}
                  className="px-4 py-2 border border-ivory-300 text-xs uppercase tracking-wider text-ink hover:bg-ivory-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold hover:bg-gold-600 text-ivory text-xs uppercase tracking-wider font-semibold shadow transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COLOR MODAL */}
      {editingColor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ivory border-2 border-gold/50 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-ivory-300 pb-3">
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-crimson" />
                <h3 className="font-serif text-lg text-ink uppercase">Edit Color Option</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingColor(null)}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateColor} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-ink-muted mb-1.5 font-medium">
                  Color Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editingColor.name}
                  onChange={(e) => setEditingColor({ ...editingColor, name: e.target.value })}
                  placeholder="e.g. Royal Maroon, Antique Gold"
                  className="w-full border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none focus:border-crimson bg-white"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-ink-muted mb-1.5 font-medium">
                  Hex Color Code & Picker
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={editingColor.hex}
                    onChange={(e) => setEditingColor({ ...editingColor, hex: e.target.value })}
                    className="w-12 h-10 border border-ivory-300 rounded cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    required
                    value={editingColor.hex}
                    onChange={(e) => setEditingColor({ ...editingColor, hex: e.target.value })}
                    placeholder="#5E1A2D"
                    className="flex-1 font-mono uppercase border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none focus:border-crimson bg-white"
                  />
                  <div
                    className="w-10 h-10 rounded border-2 border-gold shadow-inner flex-shrink-0"
                    style={{ backgroundColor: editingColor.hex }}
                    title="Live preview"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-ivory-300">
                <button
                  type="button"
                  onClick={() => setEditingColor(null)}
                  className="px-4 py-2 border border-ivory-300 text-xs uppercase tracking-wider text-ink hover:bg-ivory-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-crimson hover:bg-burgundy text-ivory text-xs uppercase tracking-wider font-semibold shadow transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
