import { motion, AnimatePresence } from "motion/react";
import { X, Camera, Upload } from "lucide-react";

interface PhotoDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function PhotoDrawer({ open, onClose }: PhotoDrawerProps) {
  const handlePhotoUpload = () => {
    alert("拍照/上传功能（演示）");
    onClose();
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
          >
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl">拍照录入</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <button
                  onClick={handlePhotoUpload}
                  className="w-full flex items-center gap-4 p-6 bg-muted hover:bg-accent rounded-xl transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#3B82F6] flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium mb-1">拍摄照片</div>
                    <div className="text-sm text-muted-foreground">
                      使用相机拍摄考勤表
                    </div>
                  </div>
                </button>

                <button
                  onClick={handlePhotoUpload}
                  className="w-full flex items-center gap-4 p-6 bg-muted hover:bg-accent rounded-xl transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium mb-1">从相册选择</div>
                    <div className="text-sm text-muted-foreground">
                      选择已有的考勤照片
                    </div>
                  </div>
                </button>
              </div>

              <div className="p-6 pt-0">
                <div className="text-sm text-muted-foreground text-center">
                  支持自动识别考勤表中的时间信息
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
