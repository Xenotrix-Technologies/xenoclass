const { getmultipleSP, executeTransaction } = require('./sp-caller');
const { subscribeToTopic, sendNotifToTopic } = require('../helpers/firebase');

function initializeTeacherChat(io) {
    io.on('connection', (socket) => {
        console.log('A user connected');

        const handleError = (operation, error) => {
            console.error(`Error ${operation}:`, error);
            socket.emit('error', { message: `Failed to ${operation}` });
        };

        const joinRoom = (roomId, emit) => {
            socket.join(roomId);
            console.log(`User joined ${roomId} ${emit}`);
        };

        const leaveRoom = (roomId) => {
            socket.leave(roomId);
            console.log(`User left ${roomId}`);
        };

        const getListId = (id, isStudent, chatType = 'teacher_student') => `${id}-List${isStudent ? 'student' : 'Teacher'}${chatType}`;


        const getConversationId = (senderId, receiverId, chatType) => `${chatType}-${senderId}-${receiverId}`;

        socket.on('join conversation', async ({ teacherId, studentId, isStudent, chatType = 'teacher_student', courseId }) => {
            const validTeacherId = Number(teacherId);
            const validStudentId = Number(studentId);
            if (!validTeacherId || isNaN(validTeacherId) || validTeacherId <= 0 || !validStudentId || isNaN(validStudentId) || validStudentId <= 0) {
                console.warn('⚠️ join conversation received invalid teacherId or studentId:', { teacherId, studentId });
                return;
            }

            const conversationId = getConversationId(validTeacherId, validStudentId, chatType);
            joinRoom(conversationId, 'join conversation');

            try {
                let results;
                if (chatType === 'teacher_student') {
                    await executeTransaction('mark_as_read', [validTeacherId, validStudentId, isStudent ? 1 : 0, chatType]);
                    results = await getmultipleSP('get_chat_call_history', [validTeacherId, validStudentId]);
                } else {
                    await executeTransaction('mark_as_read', [validTeacherId, validStudentId, isStudent ? 1 : 0, chatType]);
                    results = await getmultipleSP('get_hod_chat_history', [validStudentId, courseId || 0]);
                }

                let parsedHistory = {};
                if (results && results[0] && results[0][0]) {
                    const rawResult = results[0][0]['result_json'];
                    if (typeof rawResult === 'string') {
                        try {
                            parsedHistory = JSON.parse(rawResult);
                        } catch (e) {
                            parsedHistory = {};
                        }
                    } else if (rawResult && typeof rawResult === 'object') {
                        parsedHistory = rawResult;
                    }
                }

                io.to(conversationId).emit('chat history', parsedHistory);
                socket.emit('chat history', parsedHistory);
            } catch (error) {
                handleError('retrieving chat history', error);
            }
        });

        socket.on('leave conversation', ({ teacherId, studentId, isStudent, chatType = 'teacher_student' }) => {
            const validTeacherId = Number(teacherId);
            const validStudentId = Number(studentId);
            if (validTeacherId && validStudentId) {
                leaveRoom(getConversationId(validTeacherId, validStudentId, chatType));
            }
        });

        socket.on('get list', async ({ id, isStudent, chatType = 'teacher_student' }) => {
            const listId = getListId(id, isStudent, chatType);
            joinRoom(listId, 'get list');
            let list = [];
            const [teacherId, studentId] = isStudent ? [0, id] : [id, 0];
            try {
                if (chatType === 'teacher_student') {
                    const sender = isStudent ? 'student' : 'teacher';
                    list = await executeTransaction('Get_Calls_And_Chats_List', ['chat', sender, teacherId, studentId]);
                } else {
                    list = await executeTransaction('Get_ChatList_Hod', [teacherId]);
                }

                io.to(listId).emit('chat list', list || []);
                socket.emit('chat list', list || []);
            } catch (error) {
                handleError('retrieving chat list', error);
            }
        });

        socket.on('Check_Call_Availability', async ({ user_Id, is_Student_Calling, chatType = 'teacher_student' }) => {
            try {
                console.log('user_Id: ', user_Id);
                const listId = getListId(user_Id, is_Student_Calling, chatType);
                joinRoom(listId, 'Check_Call_Availability');
                console.log('listId: ', listId);

                const list = await executeTransaction('Check_Call_Availability', [user_Id, is_Student_Calling]);
                io.to(listId).emit('User_Availability_Status', list);
            } catch (error) {
                handleError('retrieving chat list', error);
            }
        });

        socket.on('Get_Ongoing_Calls', async ({ user_Id, isStudent = 0 }) => {
            try {
                console.log('user_Id: ', user_Id);
                const userTopic = `${isStudent ? `STD-` : `TCR-`}${user_Id}`;
                console.log('userTopic: ', userTopic);

                joinRoom(userTopic, 'Get_Ongoing_Calls');

                const list = await executeTransaction('Get_Ongoing_Calls', [user_Id, isStudent]);
                io.to(userTopic).emit('Get_Ongoing_Calls', list);
            } catch (error) {
                handleError('retrieving Get_Ongoing_Calls list', error);
            }
        });

        socket.on('Get_Live_Classes_By_CourseId', async ({ user_Id, course_Id, batch_Id }) => {
            try {
                const userTopic = `Grp-${course_Id}-${batch_Id}`;
                console.log('userTopic3: ', userTopic);

                joinRoom(userTopic, 'Get_Live_Classes_By_CourseId');

                const list = await executeTransaction('Get_Live_Classes_By_CourseId', [course_Id, 0, batch_Id]);
                console.log('list:Get_Live_Classes_By_CourseId ', list);
                io.to(userTopic).emit('Get_Live_Classes_By_CourseId', list);
            } catch (error) {
                handleError('retrieving Get_Live_Classes_By_CourseId list', error);
            }
        });

        socket.on('leave chatlist', ({ id, isStudent, chatType = 'teacher_student' }) => {
            leaveRoom(getListId(id, isStudent, chatType));
        });

        socket.on('send message', async ({ teacherId, studentId, message, chatType = 'teacher_student', course_id, isStudent, File_Path, fileSize, thumbUrl, senderName = '', profileUrl = '' }) => {
            const validTeacherId = Number(teacherId);
            const validStudentId = Number(studentId);
            if (!validTeacherId || isNaN(validTeacherId) || validTeacherId <= 0 || !validStudentId || isNaN(validStudentId) || validStudentId <= 0 || !message) {
                console.warn('⚠️ send message received invalid arguments:', { teacherId, studentId, message });
                return;
            }

            let msgHeading = senderName ? `New Message from ${senderName}` : 'New Message';
            const conversationId = getConversationId(validTeacherId, validStudentId, chatType);
            const ToUser = isStudent ? validTeacherId : validStudentId;
            const sendToId = `${ToUser}-List${isStudent ? 'Teacher' : 'student'}${chatType}`;
            const senderId = isStudent ? validStudentId : validTeacherId;
            const senderListId = getListId(senderId, !!isStudent, chatType);

            try {
                if (chatType === 'teacher_student') {
                    await getmultipleSP('insert_chat_message', [validTeacherId, validStudentId, message, isStudent ? 1 : 0, File_Path || null, fileSize || 0, thumbUrl || null]);
                    
                    // Emit message to active conversation
                    io.to(conversationId).emit('new message', { teacherId: validTeacherId, studentId: validStudentId, message, chatType, course_id, isStudent: isStudent ? 1 : 0, File_Path, fileSize, thumbUrl, senderName, profileUrl, timestamp: new Date().toISOString() });

                    // Update chat list for receiver
                    const receiverSender = isStudent ? 'teacher' : 'student';
                    const [listTeacherId, listStudentId] = receiverSender === 'teacher' ? [validTeacherId, 0] : [0, validStudentId];
                    const receiverList = await executeTransaction('Get_Calls_And_Chats_List', ['chat', receiverSender, listTeacherId, listStudentId]);
                    io.to(sendToId).emit('chat list', receiverList || []);

                    // Update chat list for sender
                    const senderRole = isStudent ? 'student' : 'teacher';
                    const [sTeacherId, sStudentId] = senderRole === 'teacher' ? [teacherId, 0] : [0, studentId];
                    const senderList = await executeTransaction('Get_Calls_And_Chats_List', ['chat', senderRole, sTeacherId, sStudentId]);
                    io.to(senderListId).emit('chat list', senderList || []);

                } else {
                    await getmultipleSP('insert_hod_chat_message', [teacherId, studentId, course_id || 0, message, isStudent ? 1 : 0, File_Path || null, fileSize || 0, thumbUrl || null]);
                    
                    io.to(conversationId).emit('new message', { teacherId, studentId, message, chatType, course_id, isStudent: isStudent ? 1 : 0, File_Path, fileSize, thumbUrl, senderName, profileUrl, timestamp: new Date().toISOString() });

                    if (isStudent) {
                        const list = await executeTransaction('Get_ChatList_Hod', [teacherId]);
                        io.to(sendToId).emit('chat list', list || []);
                    }
                }

                // Push notification to FCM topic
                try {
                    const userTopic = `${!isStudent ? `STD-` : `TCR-`}${ToUser}`;
                    const data = {
                        type: 'new_message',
                        course_id: String(course_id || '0'),
                        senderName: String(senderName || ''),
                        profileUrl: String(profileUrl || ''),
                        sender_id: `${isStudent ? studentId : teacherId}`,
                        receiver_id: `${isStudent ? teacherId : studentId}`,
                        message_content: String(message || ''),
                        timestamp: new Date().toISOString(),
                    };
                    await sendNotifToTopic(userTopic, msgHeading, data.message_content, data);
                } catch (fcmError) {
                    console.warn('FCM push notification skipped/failed:', fcmError.message);
                }

            } catch (error) {
                handleError('sending message', error);
            }
        });

        socket.on('mark as read', async (data) => {
            try {
                const { teacherId, studentId, isStudent, chatType = 'teacher_student' } = data;
                await executeTransaction('mark_as_read', [teacherId, studentId, isStudent ? 1 : 0, chatType]);
            } catch (error) {
                handleError('marking as read', error);
            }
        });

        socket.on('leave conversation', async ({ teacherId, studentId, isStudent, chatType = 'teacher_student' }) => {
            const id = isStudent ? studentId : teacherId;
            leaveRoom(getConversationId(teacherId, studentId, chatType));
            if (chatType === 'teacher_student') {
                const listId = getListId(id, isStudent, chatType);
                const [tId, sId] = isStudent ? [0, id] : [id, 0];
                const sender = isStudent ? 'student' : 'teacher';

                try {
                    const list = await executeTransaction('Get_Calls_And_Chats_List', ['chat', sender, tId, sId]);
                    io.to(listId).emit('chat list', list || []);
                } catch (e) {
                    console.error('Error refreshing list on leave conversation:', e.message);
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });
}

module.exports = initializeTeacherChat;


