import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PatchNote, PatchNoteType } from '../types';
import { patchNotes } from '../patchNotesData';
import { X, Sparkles, Bug, Zap, Calendar, History } from 'lucide-react';

interface PatchNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PatchNotesModal: React.FC<PatchNotesModalProps> = ({ isOpen, onClose }) => {
  const getTypeStyles = (type: PatchNoteType) => {
    switch (type) {
      case 'feature':
        return {
          bg: 'bg-indigo-500/10',
          text: 'text-indigo-400',
          border: 'border-indigo-500/30',
          icon: <Sparkles className="w-3 h-3" />,
          label: '기능 추가'
        };
      case 'fix':
        return {
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          border: 'border-rose-500/30',
          icon: <Bug className="w-3 h-3" />,
          label: '버그 수정'
        };
      case 'improvement':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          icon: <Zap className="w-3 h-3" />,
          label: '성능 개선'
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                  <History className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">서비스 업데이트 소식</h3>
                  <p className="text-slate-400 text-sm">혁신 블로그 AI의 발전 과정을 확인하세요</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-160px)] space-y-8 custom-scrollbar">
              {patchNotes.map((note, index) => (
                <div key={note.version} className="relative pl-8">
                  {/* Timeline Line */}
                  {index !== patchNotes.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-[-40px] w-[2px] bg-slate-800" />
                  )}
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center flex-wrap gap-3">
                      <span className="text-indigo-400 font-black font-mono text-lg">v{note.version}</span>
                      <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                        <Calendar className="w-4 h-4" />
                        {note.date}
                      </div>
                      {(() => {
                        const style = getTypeStyles(note.type);
                        return (
                          <span className={`${style.bg} ${style.text} ${style.border} border px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1`}>
                            {style.icon}
                            {style.label}
                          </span>
                        );
                      })()}
                    </div>
                    
                    <h4 className="text-white font-bold text-lg">{note.title}</h4>
                    
                    <ul className="space-y-2">
                      {note.changes.map((change, i) => (
                        <li key={i} className="text-slate-400 text-sm leading-relaxed flex gap-2">
                          <span className="text-indigo-500 shrink-0">•</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-500 italic">
                더 나은 서비스를 위해 항상 노력하는 혁신 AI가 되겠습니다.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PatchNotesModal;
