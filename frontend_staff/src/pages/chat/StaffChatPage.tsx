import React, { useState, useEffect, useRef } from 'react';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { teacherService } from '../../services/teacherService';
import { getStaffSocket } from '../../services/socket';
import { r2Service } from '../../services/r2Service';
import {
  Search,
  ChevronLeft,
  Paperclip,
  Mic,
  Send,
  Video,
  FileText,
  CheckCheck,
  Loader2,
  Play,
  Pause,
  RefreshCw,
  Users,
  MessageSquare,
  Image as ImageIcon,
  Film,
  Download,
  X,
  Trash2,
} from 'lucide-react';

interface MessageItem {
  id: string | number;
  sender: 'teacher' | 'student';
  text: string;
  filePath: string | null;
  fileSize?: number;
  time: string;
  date: string;
}

// -------------------------------------------------------------
// Voice Message Audio Player Component
// -------------------------------------------------------------
const VoicePlayer: React.FC<{ src: string; isTeacher: boolean }> = ({ src, isTeacher }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const setAudioData = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('durationchange', setAudioData);
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime || 0));
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('durationchange', setAudioData);
      audioRef.current = null;
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Audio play error:', e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const formatSecs = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center space-x-2.5 py-1 min-w-[210px]">
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 shadow-xs cursor-pointer ${
          isTeacher ? 'bg-white text-[#1863D3] hover:bg-blue-50' : 'bg-[#1863D3] text-white hover:bg-[#1A7AE8]'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className={`w-full h-1.5 rounded-lg cursor-pointer transition-all ${
            isTeacher ? 'accent-white bg-blue-400/40' : 'accent-[#1863D3] bg-gray-200'
          }`}
        />
        <div className={`text-[10px] flex justify-between mt-1 font-medium ${isTeacher ? 'text-blue-100' : 'text-[#808B9A]'}`}>
          <span>{formatSecs(currentTime)}</span>
          <span>{duration ? formatSecs(duration) : 'Voice note'}</span>
        </div>
      </div>
    </div>
  );
};

export const StaffChatPage: React.FC = () => {
  const { user } = useStaffAuth();

  const [activeTab, setActiveTab] = useState<'chats' | 'students'>('chats');
  const [chatList, setChatList] = useState<any[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Media Attachment States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const selectedStudentRef = useRef<any>(null);

  selectedStudentRef.current = selectedStudent;

  const teacherId = Number(user?.User_ID || user?.Id || user?.Teacher_ID || 0);
  const teacherName = `${user?.First_Name || user?.User_Name || ''} ${user?.Last_Name || ''}`.trim() || 'Faculty';

  useEffect(() => {
    if (!teacherId) return;

    const socket = getStaffSocket();

    // 1. Join chat list room
    socket.emit('get list', { id: teacherId, isStudent: false, chatType: 'teacher_student' });

    // 2. Load assigned students from backend
    loadAssignedStudents();

    // 3. Socket event handlers
    const handleChatList = (list: any[]) => {
      console.log('[Staff Socket] Received chat list:', list);
      const safeList = Array.isArray(list) ? list : [];
      setChatList(safeList);
      setLoading(false);
    };

    const handleChatHistory = (history: any) => {
      console.log('[Staff Socket] Received chat history:', history);
      setLoadingMessages(false);
      const parsed = parseChatHistory(history);
      setMessages(parsed);
      setTimeout(scrollToBottom, 60);
    };

    const handleNewMessage = (msg: any) => {
      console.log('[Staff Socket] Received new message:', msg);
      const current = selectedStudentRef.current;
      const curStudentId = Number(current?.studentId || current?.student_id || current?.Student_ID || 0);
      const msgStudentId = Number(msg.studentId || msg.student_id);

      if (curStudentId && msgStudentId === curStudentId) {
        const isTeacher = Number(msg.isStudent) === 0;
        const newMsgObj: MessageItem = {
          id: msg.message_id || Date.now(),
          sender: isTeacher ? 'teacher' : 'student',
          text: msg.message || '',
          filePath: msg.File_Path || null,
          fileSize: msg.fileSize || 0,
          time: new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          date: formatDateHeader(msg.timestamp || new Date()),
        };
        setMessages((prev) => [...prev, newMsgObj]);
        setTimeout(scrollToBottom, 60);
      }
    };

    socket.on('chat list', handleChatList);
    socket.on('chat history', handleChatHistory);
    socket.on('new message', handleNewMessage);

    return () => {
      socket.off('chat list', handleChatList);
      socket.off('chat history', handleChatHistory);
      socket.off('new message', handleNewMessage);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [teacherId]);

  // Filter list by search query and active tab
  useEffect(() => {
    const listToFilter = activeTab === 'chats' ? chatList : assignedStudents;
    if (!searchQuery.trim()) {
      setFilteredList(listToFilter);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredList(
        listToFilter.filter((item) => {
          const name = `${item.firstName || item.First_Name || ''} ${
            item.lastName || item.Last_Name || ''
          }`.toLowerCase();
          const content = (item.chatMessage || item.message || item.Email || item.Course_Name || '').toLowerCase();
          return name.includes(q) || content.includes(q);
        })
      );
    }
  }, [searchQuery, chatList, assignedStudents, activeTab]);

  const loadAssignedStudents = async () => {
    try {
      const res = await teacherService.getFacultyBatchStudents(teacherId);
      if (Array.isArray(res)) {
        const map = new Map();
        res.forEach((s: any) => {
          const id = s.Student_ID || s.student_id || s.studentId;
          if (id && !map.has(id)) {
            map.set(id, {
              ...s,
              studentId: id,
              firstName: s.First_Name || s.firstName,
              lastName: s.Last_Name || s.lastName,
              profilePhotoPath: s.Profile_Photo_Path,
            });
          }
        });
        setAssignedStudents(Array.from(map.values()));
      }
    } catch (err) {
      console.warn('Error loading faculty batch students:', err);
    }
  };

  const parseChatHistory = (historyObj: any): MessageItem[] => {
    if (!historyObj || typeof historyObj !== 'object') return [];
    const flat: MessageItem[] = [];

    Object.keys(historyObj).forEach((dateKey) => {
      const dateList = historyObj[dateKey];
      if (Array.isArray(dateList)) {
        dateList.forEach((item: any) => {
          if (item.message !== null && item.message !== undefined) {
            const isStudent = Number(item.is_student) === 1;
            flat.push({
              id: item.message_id || Math.random(),
              sender: isStudent ? 'student' : 'teacher',
              text: item.message,
              filePath: item.File_Path || null,
              fileSize: item.fileSize || 0,
              time: item.message_timestamp
                ? new Date(item.message_timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '12:00 PM',
              date: formatDateHeader(dateKey),
            });
          }
        });
      }
    });

    return flat;
  };

  const formatDateHeader = (dateInput: string | Date) => {
    try {
      const d = new Date(dateInput);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const check = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (check.getTime() === today.getTime()) return 'Today';
      if (check.getTime() === yesterday.getTime()) return 'Yesterday';
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return 'Today';
    }
  };

  const handleSelectStudent = (student: any) => {
    const prev = selectedStudentRef.current;
    const socket = getStaffSocket();

    const newStudentId = Number(
      student.studentId || student.student_id || student.Student_ID || student.Id || student.id || 0
    );

    if (!newStudentId || isNaN(newStudentId) || newStudentId <= 0) {
      console.warn('Cannot select student: invalid studentId', student);
      return;
    }

    if (prev) {
      const prevStudentId = Number(
        prev.studentId || prev.student_id || prev.Student_ID || prev.Id || prev.id || 0
      );
      if (prevStudentId && prevStudentId !== newStudentId) {
        socket.emit('leave conversation', {
          teacherId,
          studentId: prevStudentId,
          isStudent: false,
          chatType: 'teacher_student',
        });
      }
    }

    setSelectedStudent(student);
    setMessages([]);
    setLoadingMessages(true);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setShowAttachMenu(false);

    // Join socket conversation room
    socket.emit('join conversation', {
      teacherId,
      studentId: newStudentId,
      isStudent: false,
      chatType: 'teacher_student',
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // -------------------------------------------------------------
  // File Attachment Handling
  // -------------------------------------------------------------
  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setShowAttachMenu(false);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const clearSelectedFile = () => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null);
    setFilePreviewUrl(null);
  };

  // -------------------------------------------------------------
  // Voice Recording Handling
  // -------------------------------------------------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      alert('Could not access microphone. Please check browser permissions.');
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const finishAndSendRecording = async () => {
    if (!mediaRecorderRef.current || !selectedStudent) return;
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);

    const studentId = Number(
      selectedStudent.studentId || selectedStudent.student_id || selectedStudent.Student_ID || selectedStudent.Id || 0
    );

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (audioBlob.size > 0) {
        try {
          setUploadingMedia(true);
          const uploadRes = await r2Service.uploadVoiceBlob(audioBlob, `voice_${Date.now()}.webm`);

          const socket = getStaffSocket();
          socket.emit('send message', {
            teacherId,
            studentId,
            message: 'Voice Message',
            chatType: 'teacher_student',
            isStudent: 0,
            senderName: teacherName,
            profileUrl: user?.Profile_Photo_Path || '',
            File_Path: uploadRes.fileUrl,
            fileSize: uploadRes.fileSize,
            thumbUrl: null,
          });
        } catch (err: any) {
          console.error('Failed to upload voice message:', err);
          alert('Failed to send voice message: ' + err.message);
        } finally {
          setUploadingMedia(false);
          setRecordingSeconds(0);
          audioChunksRef.current = [];
        }
      }
    };

    mediaRecorderRef.current.stop();
    if (mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
  };

  // -------------------------------------------------------------
  // Send Message (Text and/or File)
  // -------------------------------------------------------------
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || !selectedStudent) return;

    const studentId = Number(
      selectedStudent.studentId || selectedStudent.student_id || selectedStudent.Student_ID || selectedStudent.Id || selectedStudent.id || 0
    );

    if (!studentId || isNaN(studentId) || studentId <= 0 || !teacherId) {
      console.warn('Cannot send message: invalid studentId or teacherId', { studentId, teacherId });
      return;
    }

    try {
      setUploadingMedia(true);
      let uploadedFilePath: string | null = null;
      let uploadedFileSize = 0;

      if (selectedFile) {
        const uploadRes = await r2Service.uploadFile(selectedFile);
        uploadedFilePath = uploadRes.fileUrl;
        uploadedFileSize = uploadRes.fileSize;
      }

      const msgText = inputText.trim() || (selectedFile ? selectedFile.name : '');
      const socket = getStaffSocket();

      socket.emit('send message', {
        teacherId,
        studentId,
        message: msgText,
        chatType: 'teacher_student',
        isStudent: 0,
        senderName: teacherName,
        profileUrl: user?.Profile_Photo_Path || '',
        File_Path: uploadedFilePath,
        fileSize: uploadedFileSize,
        thumbUrl: null,
      });

      setInputText('');
      clearSelectedFile();
    } catch (err: any) {
      console.error('Error sending message/attachment:', err);
      alert('Failed to send attachment: ' + err.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleStartMeet = () => {
    window.open('https://meet.google.com/new?authuser=0', '_blank');
  };

  const refreshList = () => {
    setLoading(true);
    const socket = getStaffSocket();
    socket.emit('get list', { id: teacherId, isStudent: false, chatType: 'teacher_student' });
    loadAssignedStudents();
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E3E7EE] shadow-sm h-[calc(100vh-8.5rem)] flex overflow-hidden font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. CHAT LIST PANEL */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-[#E3E7EE] flex flex-col bg-[#F4F7FA] ${
          selectedStudent ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header with Search & Tabs */}
        <div className="p-4 bg-white border-b border-[#E3E7EE] space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-[18px] font-bold text-[#283B52]">Student Chats</h1>
            <button
              type="button"
              onClick={refreshList}
              className="p-1.5 text-gray-400 hover:text-[#1863D3] rounded-lg hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-[#F4F7FA] p-1 rounded-xl border border-[#E3E7EE]">
            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'chats'
                  ? 'bg-[#1863D3] text-white shadow-2xs'
                  : 'text-[#6A7487] hover:text-[#283B52]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Recent ({chatList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'students'
                  ? 'bg-[#1863D3] text-white shadow-2xs'
                  : 'text-[#6A7487] hover:text-[#283B52]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Batch Students ({assignedStudents.length})</span>
            </button>
          </div>

          {/* Search TextField */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#BAC1CA] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'chats' ? 'Search Conversations' : 'Search Batch Students'}
              className="w-full h-[38px] pl-10 pr-4 bg-[#F4F7FA] text-[#212A36] text-[13px] font-medium rounded-xl border border-[#E3E7EE] focus:bg-white focus:border-[#1863D3] focus:outline-none placeholder:text-[#808B9A] transition-colors"
            />
          </div>
        </div>

        {/* Chat / Student List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E3E7EE]">
          {loading && filteredList.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              <Loader2 className="w-7 h-7 animate-spin text-[#1863D3] mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading student chats...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-20 text-center text-gray-400 px-6">
              <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-[13px] font-semibold text-[#283B52]">
                {activeTab === 'chats' ? 'No recent conversations' : 'No batch students found'}
              </p>
              <p className="text-[11px] text-[#808B9A] mt-1">
                {activeTab === 'chats'
                  ? 'Switch to the "Batch Students" tab to message enrolled students.'
                  : 'Students enrolled in your courses will appear here.'}
              </p>
            </div>
          ) : (
            filteredList.map((item, idx) => {
              const currentId = Number(
                selectedStudent?.studentId ||
                  selectedStudent?.student_id ||
                  selectedStudent?.Student_ID ||
                  selectedStudent?.Id
              );
              const itemId = Number(item.studentId || item.student_id || item.Student_ID || item.Id);
              const isSelected = currentId === itemId;

              const studentFullName = `${item.firstName || item.First_Name || 'Student'} ${
                item.lastName || item.Last_Name || ''
              }`.trim();

              const lastMessage = item.chatMessage || item.message || item.Course_Name || 'Click to start conversation';
              const unreadCount = Number(item.unread_count || item.unreadCount || 0);
              const displayTime = item.timestamp ? formatDateHeader(item.timestamp) : '';

              return (
                <div
                  key={itemId || idx}
                  onClick={() => handleSelectStudent(item)}
                  className={`p-3.5 sm:px-4 cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-[#E5F0FF]' : 'hover:bg-white bg-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                    <div className="w-[42px] h-[42px] rounded-full bg-[#1863D3] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                      {studentFullName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[14px] font-bold text-[#000000] truncate">
                          {studentFullName}
                        </h3>
                        {displayTime && (
                          <span className="text-[10px] text-[#808B9A] font-semibold shrink-0 ml-1">
                            {displayTime}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] font-medium text-[#6A7487] truncate mt-0.5">
                        {lastMessage}
                      </p>
                    </div>
                  </div>

                  {unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-[#1863D3] text-white flex items-center justify-center text-[10px] font-bold shrink-0 ml-2">
                      {unreadCount}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CHAT CONVERSATION SCREEN */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`flex-1 flex flex-col bg-white ${
          !selectedStudent ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedStudent ? (
          <>
            {/* Top Conversation Header */}
            <div className="h-[60px] px-4 sm:px-6 bg-white border-b border-[#E3E7EE] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="md:hidden w-[32px] h-[32px] rounded-full bg-[#E5F0FF] text-[#6A7487] hover:text-[#1863D3] flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="w-[38px] h-[38px] rounded-full bg-[#1863D3] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {(selectedStudent.firstName || selectedStudent.First_Name || 'S')
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h2 className="text-[15px] font-bold text-[#283B52] leading-tight">
                    {selectedStudent.firstName || selectedStudent.First_Name}{' '}
                    {selectedStudent.lastName || selectedStudent.Last_Name || ''}
                  </h2>
                  <p className="text-[11px] text-[#28BC63] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#28BC63] inline-block" />
                    Enrolled Student
                  </p>
                </div>
              </div>

              {/* Action: Start Live Meet */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleStartMeet}
                  className="px-3 py-1.5 bg-[#1863D3] hover:bg-[#1A7AE8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Start 1:1 Live Video Call"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Start Call</span>
                </button>
              </div>
            </div>

            {/* Conversation Message Feed */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-[#F4F7FA]">
              {loadingMessages ? (
                <div className="py-20 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1863D3] mx-auto mb-2" />
                  <p className="text-xs font-semibold">Loading conversation...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-20 text-center text-gray-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-semibold">No messages yet</p>
                  <p className="text-[11px] text-[#808B9A] mt-1">Send a message below to start chatting.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isTeacher = msg.sender === 'teacher';
                  const showDateHeader =
                    index === 0 || messages[index - 1].date !== msg.date;

                  const fileCat = msg.filePath ? r2Service.getFileCategory(msg.filePath) : 'other';

                  return (
                    <React.Fragment key={msg.id || index}>
                      {showDateHeader && (
                        <div className="text-center my-2">
                          <span className="bg-white border border-[#E3E7EE] text-[#6A7487] text-[10px] font-bold px-3 py-0.5 rounded-full shadow-2xs">
                            {msg.date}
                          </span>
                        </div>
                      )}

                      <div className={`flex flex-col ${isTeacher ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs space-y-1.5 shadow-xs ${
                            isTeacher
                              ? 'bg-[#1863D3] text-white rounded-br-none'
                              : 'bg-white text-[#212A36] border border-[#E3E7EE] rounded-bl-none'
                          }`}
                        >
                          {/* 1. Image Preview */}
                          {msg.filePath && fileCat === 'image' && (
                            <div className="rounded-xl overflow-hidden mb-1 max-w-[280px] bg-black/5">
                              <img
                                src={msg.filePath}
                                alt="Shared photo"
                                className="w-full max-h-[260px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => window.open(msg.filePath!, '_blank')}
                              />
                            </div>
                          )}

                          {/* 2. Video Player */}
                          {msg.filePath && fileCat === 'video' && (
                            <div className="rounded-xl overflow-hidden mb-1 max-w-[320px] bg-black">
                              <video
                                src={msg.filePath}
                                controls
                                className="w-full max-h-[260px] rounded-xl"
                                preload="metadata"
                              />
                            </div>
                          )}

                          {/* 3. Voice Message Player */}
                          {msg.filePath && fileCat === 'audio' && (
                            <VoicePlayer src={msg.filePath} isTeacher={isTeacher} />
                          )}

                          {/* 4. Document / Other File Attachment */}
                          {msg.filePath && (fileCat === 'document' || fileCat === 'other') && (
                            <a
                              href={msg.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center space-x-2.5 p-2.5 rounded-xl transition-all mb-1 border ${
                                isTeacher
                                  ? 'bg-blue-600/40 border-blue-400/40 text-white hover:bg-blue-600/60'
                                  : 'bg-gray-50 border-gray-200 text-[#283B52] hover:bg-gray-100'
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isTeacher ? 'bg-white/20 text-white' : 'bg-[#1863D3]/10 text-[#1863D3]'
                                }`}
                              >
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold truncate">
                                  {msg.text && msg.text !== 'Attached Document' ? msg.text : 'Download Attachment'}
                                </p>
                                <p className={`text-[10px] ${isTeacher ? 'text-blue-100' : 'text-[#6A7487]'}`}>
                                  {msg.fileSize ? r2Service.formatBytes(msg.fileSize) : 'Document file'}
                                </p>
                              </div>
                              <Download className="w-4 h-4 opacity-75 shrink-0" />
                            </a>
                          )}

                          {/* Text Caption / Regular Message */}
                          {msg.text && (
                            (!msg.filePath || (fileCat !== 'document' && fileCat !== 'other' && msg.text !== 'Voice Message')) && (
                              <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            )
                          )}

                          {/* Timestamp and Read Receipt */}
                          <div
                            className={`text-[9px] text-right font-medium flex items-center justify-end gap-1 ${
                              isTeacher ? 'text-blue-100' : 'text-[#808B9A]'
                            }`}
                          >
                            <span>{msg.time}</span>
                            {isTeacher && <CheckCheck className="w-3 h-3 text-blue-200" />}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Input Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-[#E3E7EE] relative">
              {/* Hidden File Inputs */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleFilePicked}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleFilePicked}
                className="hidden"
              />
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                onChange={handleFilePicked}
                className="hidden"
              />

              {/* Attachment Picker Popup Menu */}
              {showAttachMenu && (
                <div className="absolute bottom-16 left-4 bg-white rounded-2xl shadow-xl border border-[#E3E7EE] p-2 flex flex-col space-y-1 z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      imageInputRef.current?.click();
                    }}
                    className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-[#283B52] hover:bg-[#F4F7FA] rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span>Photo / Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      videoInputRef.current?.click();
                    }}
                    className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-[#283B52] hover:bg-[#F4F7FA] rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Film className="w-4 h-4" />
                    </div>
                    <span>Video Clip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      docInputRef.current?.click();
                    }}
                    className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-[#283B52] hover:bg-[#F4F7FA] rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>Document / PDF</span>
                  </button>
                </div>
              )}

              {/* File Staging Preview before Send */}
              {selectedFile && (
                <div className="mb-2 p-2.5 bg-[#F4F7FA] border border-[#E3E7EE] rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {filePreviewUrl ? (
                      <img
                        src={filePreviewUrl}
                        alt="Preview"
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1863D3] flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#283B52] truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-[#808B9A]">{r2Service.formatBytes(selectedFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Active Voice Recording UI */}
              {isRecording ? (
                <div className="flex items-center justify-between bg-red-50 p-2.5 rounded-xl border border-red-200">
                  <div className="flex items-center space-x-2 text-red-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-bold">
                      Recording Voice... {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
                      {String(recordingSeconds % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                      title="Cancel Recording"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={finishAndSendRecording}
                      disabled={uploadingMedia}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Send Voice</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Message Composer */
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu((prev) => !prev)}
                    className="p-2 text-[#808B9A] hover:text-[#1863D3] hover:bg-[#E5F0FF] rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Attach Photo, Video or Document"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Audio Record Button */}
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-2 text-[#808B9A] hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Record Voice Note"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Text Input Field */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={selectedFile ? 'Add a caption (optional)...' : 'Type a reply to student...'}
                    className="flex-1 h-[40px] px-4 bg-[#F4F7FA] text-[#212A36] text-[13px] font-medium rounded-xl border border-[#BAC1CA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1863D3]/20 focus:border-[#1863D3] transition-colors"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && !selectedFile) || uploadingMedia}
                    className="h-[40px] px-3.5 bg-[#1863D3] hover:bg-[#1A7AE8] text-white rounded-xl shadow-xs disabled:opacity-40 transition-all flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
                  >
                    {uploadingMedia ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-[#F4F7FA]">
            <div className="w-14 h-14 rounded-full bg-[#E5F0FF] text-[#1863D3] flex items-center justify-center mb-3">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#283B52]">Select a Student Conversation</h3>
            <p className="text-xs text-[#808B9A] max-w-sm mt-1">
              Select a conversation from the list or browse your batch students to send instant messages, share photos, documents, voice notes, and conduct 1:1 sessions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
