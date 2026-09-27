import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { getStudentSocket } from '../../services/socket';
import { liveService } from '../../services/liveService';
import { r2Service } from '../../services/r2Service';
import {
  ChevronLeft,
  Send,
  Video,
  CheckCheck,
  Paperclip,
  Mic,
  MessageCircle,
  Users,
  Search,
  Loader2,
  RefreshCw,
  Play,
  Pause,
  Image as ImageIcon,
  Film,
  FileText,
  Download,
  X,
  Trash2,
} from 'lucide-react';

interface StudentMessageItem {
  id: string | number;
  isStudent: boolean;
  text: string;
  filePath: string | null;
  fileSize?: number;
  time: string;
  date: string;
}

// -------------------------------------------------------------
// Voice Message Audio Player Component
// -------------------------------------------------------------
const StudentVoicePlayer: React.FC<{ src: string; isStudent: boolean }> = ({ src, isStudent }) => {
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
          isStudent ? 'bg-white text-[#1863D3] hover:bg-blue-50' : 'bg-[#1863D3] text-white hover:bg-[#1A7AE8]'
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
            isStudent ? 'accent-white bg-blue-400/40' : 'accent-[#1863D3] bg-gray-200'
          }`}
        />
        <div className={`text-[10px] flex justify-between mt-1 font-medium ${isStudent ? 'text-blue-100' : 'text-[#808B9A]'}`}>
          <span>{formatSecs(currentTime)}</span>
          <span>{duration ? formatSecs(duration) : 'Voice note'}</span>
        </div>
      </div>
    </div>
  );
};

export const StudentSupportChatPage: React.FC = () => {
  const { user } = useStudentAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'chats' | 'mentors'>('chats');
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [chatThreads, setChatThreads] = useState<any[]>([]);
  const [mentorsList, setMentorsList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<StudentMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
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
  const activeChatRef = useRef<any>(null);

  activeChatRef.current = activeChat;

  const studentId = Number(user?.Student_ID || user?.Id || user?.User_ID || 0);
  const studentName = `${user?.First_Name || user?.Student_Name || ''} ${user?.Last_Name || ''}`.trim() || 'Student';

  useEffect(() => {
    if (!studentId) return;

    const socket = getStudentSocket();

    // 1. Join chat list room
    socket.emit('get list', { id: studentId, isStudent: true, chatType: 'teacher_student' });

    // 2. Load available mentors
    loadMentors();

    // 3. Socket event handlers
    const handleChatList = (list: any[]) => {
      console.log('[Student Socket] Received chat list:', list);
      const safeList = Array.isArray(list) ? list : [];
      setChatThreads(safeList);
      setLoading(false);
    };

    const handleChatHistory = (history: any) => {
      console.log('[Student Socket] Received chat history:', history);
      setLoadingMessages(false);
      const parsed = parseChatHistory(history);
      setMessages(parsed);
      setTimeout(scrollToBottom, 60);
    };

    const handleNewMessage = (msg: any) => {
      console.log('[Student Socket] Received new message:', msg);
      const current = activeChatRef.current;
      const curTeacherId = Number(current?.teacherId || current?.teacher_id || current?.User_ID || current?.userId || 0);
      const msgTeacherId = Number(msg.teacherId || msg.teacher_id);

      if (curTeacherId && msgTeacherId === curTeacherId) {
        const isStudent = Number(msg.isStudent) === 1;
        const newMsgObj: StudentMessageItem = {
          id: msg.message_id || Date.now(),
          isStudent,
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
  }, [studentId]);

  // Check if routed directly from Mentors screen with selectedTeacher
  useEffect(() => {
    if (location.state && (location.state as any).selectedTeacher) {
      const t = (location.state as any).selectedTeacher;
      const tid = Number(t.teacherId || t.teacher_id || t.userId || t.User_ID || t.Teacher_ID || t.Id || t.id || 0);
      if (tid && !isNaN(tid) && tid > 0) {
        const teacherObj = {
          teacherId: tid,
          firstName: t.firstName || t.First_Name || t.User_Name || 'Faculty',
          lastName: t.lastName || t.Last_Name || '',
          profilePhotoPath: t.profilePhotoPath || t.Profile_Photo_Path || '',
          isHod: t.userTypeId === 3 || t.User_Type_Id === 3 || t.isHod,
          courseName: t.courseName || t.Course_Name || '',
        };
        handleSelectTeacher(teacherObj);
      }
    }
  }, [location.state, studentId]);

  const loadMentors = async () => {
    try {
      const res = await liveService.getAvailableMentors();
      const rawList = Array.isArray(res) && Array.isArray(res[0]) ? res[0] : (Array.isArray(res) ? res : []);
      const formattedList = rawList
        .map((m: any) => {
          const tid = Number(m.teacherId || m.teacher_id || m.User_ID || m.userId || m.Teacher_ID || m.Id || m.id || 0);
          return {
            ...m,
            teacherId: tid,
            firstName: m.First_Name || m.firstName || m.User_Name || 'Faculty',
            lastName: m.Last_Name || m.lastName || '',
            profilePhotoPath: m.Profile_Photo_Path || m.profilePhotoPath || '',
            courseName: m.Course_Name || m.courseName || '',
            startTime: m.start_time || m.startTime || '',
            isHod: m.User_Type_Id === 3 || m.userTypeId === 3 || m.isHod,
          };
        })
        .filter((m: any) => m.teacherId && !isNaN(m.teacherId) && m.teacherId > 0);

      setMentorsList(formattedList);
    } catch (err) {
      console.warn('Error loading mentors:', err);
    }
  };

  const parseChatHistory = (historyObj: any): StudentMessageItem[] => {
    if (!historyObj || typeof historyObj !== 'object') return [];
    const flat: StudentMessageItem[] = [];

    Object.keys(historyObj).forEach((dateKey) => {
      const dateList = historyObj[dateKey];
      if (Array.isArray(dateList)) {
        dateList.forEach((item: any) => {
          if (item.message !== null && item.message !== undefined) {
            const isStudent = Number(item.is_student) === 1;
            flat.push({
              id: item.message_id || Math.random(),
              isStudent,
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

  const handleSelectTeacher = (teacher: any) => {
    const prev = activeChatRef.current;
    const socket = getStudentSocket();

    const newTeacherId = Number(
      teacher.teacherId || teacher.teacher_id || teacher.User_ID || teacher.userId || teacher.user_id || teacher.Id || teacher.id || 0
    );

    if (!newTeacherId || isNaN(newTeacherId) || newTeacherId <= 0) {
      console.warn('Cannot select teacher: invalid teacherId', teacher);
      return;
    }

    if (prev) {
      const prevTeacherId = Number(
        prev.teacherId || prev.teacher_id || prev.User_ID || prev.userId || prev.Id || 0
      );
      if (prevTeacherId && prevTeacherId !== newTeacherId) {
        socket.emit('leave conversation', {
          teacherId: prevTeacherId,
          studentId,
          isStudent: true,
          chatType: 'teacher_student',
        });
      }
    }

    const normalizedTeacher = {
      teacherId: newTeacherId,
      firstName: teacher.firstName || teacher.First_Name || teacher.User_Name || 'Faculty',
      lastName: teacher.lastName || teacher.Last_Name || '',
      profilePhotoPath: teacher.profilePhotoPath || teacher.Profile_Photo_Path || '',
      isHod: teacher.isHod || teacher.userTypeId === 3 || teacher.User_Type_Id === 3,
      courseName: teacher.courseName || teacher.Course_Name || '',
    };

    setActiveChat(normalizedTeacher);
    setMessages([]);
    setLoadingMessages(true);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setShowAttachMenu(false);

    // Join conversation room
    socket.emit('join conversation', {
      teacherId: newTeacherId,
      studentId,
      isStudent: true,
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
    if (!mediaRecorderRef.current || !activeChat) return;
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);

    const teacherId = Number(activeChat.teacherId);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (audioBlob.size > 0) {
        try {
          setUploadingMedia(true);
          const uploadRes = await r2Service.uploadVoiceBlob(audioBlob, `voice_${Date.now()}.webm`);

          const socket = getStudentSocket();
          socket.emit('send message', {
            teacherId,
            studentId,
            message: 'Voice Message',
            chatType: 'teacher_student',
            isStudent: 1,
            senderName: studentName,
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
    if ((!inputMessage.trim() && !selectedFile) || !activeChat) return;

    const teacherId = Number(activeChat.teacherId);
    if (!teacherId || isNaN(teacherId) || teacherId <= 0 || !studentId) {
      console.warn('Cannot send message: invalid teacherId or studentId', { teacherId, studentId });
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

      const msgText = inputMessage.trim() || (selectedFile ? selectedFile.name : '');
      const socket = getStudentSocket();

      socket.emit('send message', {
        teacherId,
        studentId,
        message: msgText,
        chatType: 'teacher_student',
        isStudent: 1,
        senderName: studentName,
        profileUrl: user?.Profile_Photo_Path || '',
        File_Path: uploadedFilePath,
        fileSize: uploadedFileSize,
        thumbUrl: null,
      });

      setInputMessage('');
      clearSelectedFile();
    } catch (err: any) {
      console.error('Error sending message/attachment:', err);
      alert('Failed to send attachment: ' + err.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleStartCall = () => {
    window.open('https://meet.google.com/new?authuser=0', '_blank');
  };

  const refreshChatList = () => {
    setLoading(true);
    const socket = getStudentSocket();
    socket.emit('get list', { id: studentId, isStudent: true, chatType: 'teacher_student' });
    loadMentors();
  };

  const displayList = activeTab === 'chats' ? chatThreads : mentorsList;
  const filteredDisplayList = displayList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = `${item.firstName || item.First_Name || ''} ${item.lastName || item.Last_Name || ''}`.toLowerCase();
    const msg = (item.chatMessage || item.message || item.Course_Name || item.courseName || '').toLowerCase();
    return name.includes(q) || msg.includes(q);
  });

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif] max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col pb-4">
      {/* ============================================================= */}
      {/* VIEW 1: CHAT LIST VIEW (No Active Chat Selected) */}
      {/* ============================================================= */}
      {!activeChat ? (
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          {/* Header Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="p-1.5 -ml-1 text-[#283B52] hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
              </button>
              <h1 className="text-[20px] font-bold text-[#283B52]">Faculty Chats</h1>
            </div>

            <button
              type="button"
              onClick={refreshChatList}
              className="p-2 text-gray-400 hover:text-[#1863D3] rounded-xl hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-white p-1 rounded-2xl border border-[#E3E7EE] shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'chats'
                  ? 'bg-[#1863D3] text-white shadow-xs'
                  : 'text-[#6A7487] hover:text-[#283B52]'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Recent Chats ({chatThreads.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mentors')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'mentors'
                  ? 'bg-[#1863D3] text-white shadow-xs'
                  : 'text-[#6A7487] hover:text-[#283B52]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Faculty & Mentors ({mentorsList.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#BAC1CA] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'chats' ? 'Search messages or faculty...' : 'Search assigned mentors...'}
              className="w-full h-[40px] pl-10 pr-4 bg-white text-[#212A36] text-[13px] font-medium rounded-xl border border-[#E3E7EE] focus:border-[#1863D3] focus:outline-none placeholder:text-[#808B9A] shadow-2xs transition-colors"
            />
          </div>

          {/* Chat / Mentor List Content */}
          <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-[#E3E7EE] shadow-xs divide-y divide-[#E3E7EE]/70">
            {loading && filteredDisplayList.length === 0 ? (
              <div className="py-20 text-center text-gray-500">
                <Loader2 className="w-7 h-7 animate-spin text-[#1863D3] mx-auto mb-2" />
                <p className="text-xs font-semibold">Loading messages...</p>
              </div>
            ) : filteredDisplayList.length === 0 ? (
              <div className="py-20 text-center text-gray-400 px-6">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-[14px] font-bold text-[#283B52]">
                  {activeTab === 'chats' ? 'No recent chats' : 'No mentors found'}
                </p>
                <p className="text-[12px] text-[#808B9A] mt-1">
                  {activeTab === 'chats'
                    ? 'Switch to the "Faculty & Mentors" tab to start a new chat with your teachers.'
                    : 'Faculty assigned to your enrolled courses will appear here.'}
                </p>
              </div>
            ) : (
              filteredDisplayList.map((item, index) => {
                const isMentorTab = activeTab === 'mentors';
                const teacherIdVal = Number(
                  item.teacher_id || item.teacherId || item.User_ID || item.userId || item.Id
                );

                const name = isMentorTab && (item.userTypeId === 3 || item.User_Type_Id === 3)
                  ? item.Course_Name || item.courseName || 'Academic HOD'
                  : `${item.First_Name || item.firstName || ''} ${item.Last_Name || item.lastName || ''}`.trim() || 'Faculty';

                const subtitle = isMentorTab
                  ? item.Course_Name || item.courseName || (item.start_time ? `Available: ${item.start_time}` : 'Assigned Mentor')
                  : item.message || item.chatMessage || 'Click to open conversation';

                const unread = Number(item.unread_count || item.unreadCount || 0);
                const isHod = item.userTypeId === 3 || item.User_Type_Id === 3 || item.isHod;

                return (
                  <div
                    key={teacherIdVal || index}
                    onClick={() => handleSelectTeacher(item)}
                    className="p-4 flex items-center justify-between hover:bg-[#F4F7FA] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1 pr-3">
                      <div className="w-[46px] h-[46px] rounded-full bg-[#E5F0FF] text-[#1863D3] flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-[14px] font-bold text-[#000000] truncate">
                            {name}
                          </h3>
                          {isHod && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-600">
                              HOD
                            </span>
                          )}
                        </div>

                        <p className="text-[12px] text-[#6A7487] font-medium truncate mt-0.5">
                          {subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1 shrink-0 pl-2">
                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#1863D3] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ============================================================= */
        /* VIEW 2: ACTIVE 1:1 CHAT SCREEN */
        /* ============================================================= */
        <div className="bg-white rounded-2xl border border-[#E3E7EE] shadow-xs flex flex-col h-full overflow-hidden">
          {/* Header Bar */}
          <div className="p-3 sm:px-5 border-b border-[#E3E7EE] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <button
                type="button"
                onClick={() => setActiveChat(null)}
                className="p-1 -ml-1 text-[#283B52] hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
              </button>

              <div className="w-[40px] h-[40px] rounded-full bg-[#1863D3] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {(activeChat.firstName || 'F').charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-[15px] font-bold text-[#000000] truncate">
                    {`${activeChat.firstName} ${activeChat.lastName || ''}`.trim()}
                  </h3>
                  {activeChat.isHod && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-600">
                      HOD
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-emerald-600 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Faculty Member</span>
                </p>
              </div>
            </div>

            {/* Video Call Trigger */}
            <button
              type="button"
              onClick={handleStartCall}
              className="px-3.5 py-1.5 bg-[#1863D3] hover:bg-[#1A7AE8] text-white text-xs font-bold rounded-full transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Start Call</span>
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 bg-[#F4F7FA]">
            {loadingMessages ? (
              <div className="py-20 text-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#1863D3] mx-auto mb-2" />
                <p className="text-xs font-semibold">Loading conversation...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-semibold">No messages yet</p>
                <p className="text-[11px] text-[#808B9A] mt-1">Send a message or attachment below to ask your faculty doubts.</p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isStudent = m.isStudent;
                const showDateHeader =
                  idx === 0 || messages[idx - 1].date !== m.date;

                const fileCat = m.filePath ? r2Service.getFileCategory(m.filePath) : 'other';

                return (
                  <React.Fragment key={m.id || idx}>
                    {showDateHeader && (
                      <div className="text-center my-2">
                        <span className="bg-white border border-[#E3E7EE] text-[#6A7487] text-[10px] font-bold px-3 py-0.5 rounded-full shadow-2xs">
                          {m.date}
                        </span>
                      </div>
                    )}

                    <div className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-2xs space-y-1.5 ${
                          isStudent
                            ? 'bg-[#1863D3] text-white rounded-br-xs'
                            : 'bg-white border border-[#E3E7EE] text-[#000000] rounded-bl-xs'
                        }`}
                      >
                        {/* 1. Image Preview */}
                        {m.filePath && fileCat === 'image' && (
                          <div className="rounded-xl overflow-hidden mb-1 max-w-[280px] bg-black/5">
                            <img
                              src={m.filePath}
                              alt="Shared photo"
                              className="w-full max-h-[260px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => window.open(m.filePath!, '_blank')}
                            />
                          </div>
                        )}

                        {/* 2. Video Player */}
                        {m.filePath && fileCat === 'video' && (
                          <div className="rounded-xl overflow-hidden mb-1 max-w-[320px] bg-black">
                            <video
                              src={m.filePath}
                              controls
                              className="w-full max-h-[260px] rounded-xl"
                              preload="metadata"
                            />
                          </div>
                        )}

                        {/* 3. Voice Message Player */}
                        {m.filePath && fileCat === 'audio' && (
                          <StudentVoicePlayer src={m.filePath} isStudent={isStudent} />
                        )}

                        {/* 4. Document / File Attachment */}
                        {m.filePath && (fileCat === 'document' || fileCat === 'other') && (
                          <a
                            href={m.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center space-x-2.5 p-2.5 rounded-xl transition-all mb-1 border ${
                              isStudent
                                ? 'bg-blue-600/40 border-blue-400/40 text-white hover:bg-blue-600/60'
                                : 'bg-gray-50 border-gray-200 text-[#283B52] hover:bg-gray-100'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isStudent ? 'bg-white/20 text-white' : 'bg-[#1863D3]/10 text-[#1863D3]'
                              }`}
                            >
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate">
                                {m.text && m.text !== 'Attached Document' ? m.text : 'Download Attachment'}
                              </p>
                              <p className={`text-[10px] ${isStudent ? 'text-blue-100' : 'text-[#6A7487]'}`}>
                                {m.fileSize ? r2Service.formatBytes(m.fileSize) : 'Document file'}
                              </p>
                            </div>
                            <Download className="w-4 h-4 opacity-75 shrink-0" />
                          </a>
                        )}

                        {/* Text Caption / Message Body */}
                        {m.text && (
                          (!m.filePath || (fileCat !== 'document' && fileCat !== 'other' && m.text !== 'Voice Message')) && (
                            <p className="font-normal whitespace-pre-wrap">{m.text}</p>
                          )
                        )}

                        {/* Timestamp & Read Receipts */}
                        <div
                          className={`text-[9px] flex items-center justify-end space-x-1 font-medium ${
                            isStudent ? 'text-blue-100' : 'text-[#6A7487]'
                          }`}
                        >
                          <span>{m.time}</span>
                          {isStudent && <CheckCheck className="w-3 h-3 text-blue-200" />}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Composer Bar */}
          <div className="p-3 border-t border-[#E3E7EE] bg-white relative shrink-0">
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

            {/* Attachment Picker Popup */}
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
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {uploadingMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send Voice</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Message Composer */
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                {/* Attachment Menu Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAttachMenu((prev) => !prev)}
                  className="p-2 text-[#808B9A] hover:text-[#1863D3] hover:bg-[#E5F0FF] rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Attach Photo, Video or Document"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Voice Recording Button */}
                <button
                  type="button"
                  onClick={startRecording}
                  className="p-2 text-[#808B9A] hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Record Voice Note"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={selectedFile ? 'Add a caption (optional)...' : 'Type your message to faculty...'}
                  className="flex-1 h-[42px] px-4 bg-[#F4F7FA] text-[#000000] text-[13px] font-normal rounded-full border border-[#BAC1CA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1863D3]/20 focus:border-[#1863D3] transition-colors"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={(!inputMessage.trim() && !selectedFile) || uploadingMedia}
                  className="w-[42px] h-[42px] rounded-full bg-[#1863D3] hover:bg-[#1A7AE8] text-white flex items-center justify-center transition-colors shadow-xs disabled:opacity-40 shrink-0 cursor-pointer"
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
        </div>
      )}
    </div>
  );
};
