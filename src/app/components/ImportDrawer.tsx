import { motion, AnimatePresence } from "motion/react";
import { X, FileText, Image, Upload } from "lucide-react";
import { useState } from "react";

interface ImportDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ImportDrawer({ open, onClose }: ImportDrawerProps) {
  const [activeTab, setActiveTab] = useState<"text" | "image" | "file">("text");
  const [textInput, setTextInput] = useState("");

  const quickTemplates = [
    "按规定时间打卡",
    "全月全勤",
    "上班9:00，下班18:00",
    "请假一天",
  ];

  const handleParse = () => {
    if (textInput.trim()) {
      alert(`智能解析: "${textInput}"（演示功能）`);
      onClose();
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
            style={{ height: "80vh" }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl">批量导入</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab("text")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 transition-colors ${
                    activeTab === "text"
                      ? "text-[#3B82F6] border-b-2 border-[#3B82F6]"
                      : "text-muted-foreground"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  自由文字
                </button>
                <button
                  onClick={() => setActiveTab("image")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 transition-colors ${
                    activeTab === "image"
                      ? "text-[#3B82F6] border-b-2 border-[#3B82F6]"
                      : "text-muted-foreground"
                  }`}
                >
                  <Image className="w-4 h-4" />
                  图片识别
                </button>
                <button
                  onClick={() => setActiveTab("file")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 transition-colors ${
                    activeTab === "file"
                      ? "text-[#3B82F6] border-b-2 border-[#3B82F6]"
                      : "text-muted-foreground"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  文件导入
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "text" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {/* 快捷短语 */}
                    <div>
                      <div className="text-sm text-muted-foreground mb-3">
                        快捷短语
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {quickTemplates.map((template) => (
                          <button
                            key={template}
                            onClick={() => setTextInput(template)}
                            className="px-3 py-2 bg-muted hover:bg-accent rounded-lg text-sm transition-colors"
                          >
                            {template}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 文本输入区 */}
                    <div>
                      <div className="text-sm text-muted-foreground mb-3">
                        描述考勤情况
                      </div>
                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="例如：本周一到周五都是9点上班，6点下班。周三加班到晚上8点..."
                        className="w-full h-48 p-4 bg-muted rounded-xl resize-none outline-none focus:ring-2 focus:ring-[#3B82F6] transition-shadow"
                      />
                    </div>
                  </motion.div>
                )}

                {activeTab === "image" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full"
                  >
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Image className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <div className="text-center mb-6">
                      <div className="mb-2">上传考勤表图片</div>
                      <div className="text-sm text-muted-foreground">
                        AI 将自动识别并提取考勤信息
                      </div>
                    </div>
                    <button className="px-6 py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors">
                      选择图片
                    </button>
                  </motion.div>
                )}

                {activeTab === "file" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full"
                  >
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Upload className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <div className="text-center mb-6">
                      <div className="mb-2">导入 Excel 或 CSV 文件</div>
                      <div className="text-sm text-muted-foreground">
                        支持标准考勤表格式
                      </div>
                    </div>
                    <button className="px-6 py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors">
                      选择文件
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Action */}
              {activeTab === "text" && textInput && (
                <div className="p-6 border-t border-border">
                  <button
                    onClick={handleParse}
                    className="w-full py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors"
                  >
                    智能解析
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
