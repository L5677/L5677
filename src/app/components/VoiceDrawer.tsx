import { motion, AnimatePresence } from "motion/react";
import { X, Mic } from "lucide-react";
import { useState } from "react";

interface VoiceDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function VoiceDrawer({ open, onClose }: VoiceDrawerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  const handleRecord = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // 模拟语音识别
      setTimeout(() => {
        setTranscript("昨晚七点下班，今天早上九点上班");
        setIsRecording(false);
      }, 2000);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* 抽屉内容 */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 bg-card rounded-t-3xl z-50 max-w-md mx-auto"
            style={{ height: "70vh" }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl">语音录入</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <motion.button
                  onClick={handleRecord}
                  animate={{
                    scale: isRecording ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    repeat: isRecording ? Infinity : 0,
                    duration: 1.5,
                  }}
                  className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 ${
                    isRecording
                      ? "bg-red-500 shadow-lg shadow-red-500/50"
                      : "bg-[#3B82F6] shadow-lg shadow-[#3B82F6]/30"
                  }`}
                >
                  <Mic className="w-12 h-12 text-white" />
                </motion.button>

                <div className="text-center">
                  <div className="text-lg mb-2">
                    {isRecording ? "正在录音..." : "点击开始录音"}
                  </div>
                  {transcript && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-muted rounded-xl max-w-xs"
                    >
                      <div className="text-sm text-muted-foreground mb-2">识别结果:</div>
                      <div className="text-sm">{transcript}</div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Action */}
              {transcript && (
                <div className="p-6 border-t border-border">
                  <button
                    onClick={() => {
                      alert("已保存考勤记录（演示功能）");
                      onClose();
                    }}
                    className="w-full py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors"
                  >
                    确认并保存
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
