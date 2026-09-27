const db = require('../../config/dbconnection');
const p = db.promise();

async function seed() {
  console.log('Starting seed...');
  
  // 1. media_types
  await p.query(`
    INSERT INTO media_types (media_types_id, media_name, Delete_Status) VALUES 
    (1, 'Audio', '0'),
    (2, 'document', '0'),
    (3, 'text', '0'),
    (4, 'Multiple Choice', '0'),
    (5, 'Both', '0')
    ON DUPLICATE KEY UPDATE media_name=VALUES(media_name), Delete_Status=VALUES(Delete_Status)
  `);
  console.log('Seeded media_types');

  // 2. exam_type
  await p.query(`
    INSERT INTO exam_type (ExamType_ID, Answer_Media_Id, Have_Main_Question, Is_Main_Question_Text, Delete_Status, Have_Answer_Key, Have_Supporting_Document) VALUES 
    (1, '5', 1, 0, 0, 1, 1),
    (2, '5', 1, 1, 0, 1, 1),
    (3, '2', 0, 0, 0, 0, 1),
    (4, '1', 0, 0, 0, 0, 1)
    ON DUPLICATE KEY UPDATE Answer_Media_Id=VALUES(Answer_Media_Id), Delete_Status=VALUES(Delete_Status)
  `);
  console.log('Seeded exam_type');

  // 3. section
  await p.query(`
    INSERT INTO section (Section_ID, ExamType_ID, Section_Name, Delete_Status) VALUES 
    (1, 1, 'Videos', 0),
    (2, 2, 'Study Materials', 0)
    ON DUPLICATE KEY UPDATE Section_Name=VALUES(Section_Name), Delete_Status=VALUES(Delete_Status)
  `);
  console.log('Seeded section');

  // 4. content_visibility
  await p.query(`
    INSERT INTO content_visibility (Visibility_ID, Visbility_Name) VALUES 
    (1, 'Material'),
    (2, 'Library')
    ON DUPLICATE KEY UPDATE Visbility_Name=VALUES(Visbility_Name)
  `);
  console.log('Seeded content_visibility');

  // 5. days (1 to 60)
  const dayValues = [];
  for (let i = 1; i <= 60; i++) {
    const isExam = (i % 6 === 0) ? 1 : 0;
    dayValues.push(`(${i}, 'Day ${i}', ${isExam}, 'Day ${i}')`);
  }
  await p.query(`
    INSERT INTO days (Days_Id, Day_Name, Is_Exam_Day, alias_Name) VALUES 
    ${dayValues.join(',\n')}
    ON DUPLICATE KEY UPDATE Day_Name=VALUES(Day_Name)
  `);
  console.log('Seeded days');

  // 6. course_category
  await p.query(`
    INSERT INTO course_category (Category_ID, Category_Name, Delete_Status, Enabled_Status) VALUES 
    (1, 'General English', 0, 1),
    (2, 'IELTS Preparation', 0, 1),
    (3, 'OET Intensive', 0, 1),
    (4, 'Spoken English', 0, 1),
    (5, 'Grammar Masterclass', 0, 1)
    ON DUPLICATE KEY UPDATE Category_Name=VALUES(Category_Name), Delete_Status=0, Enabled_Status=1
  `);
  console.log('Seeded course_category');

  // 7. user_type
  await p.query(`
    INSERT INTO user_type (User_Type_Id, User_Type_Name, Delete_Status) VALUES 
    (1, 'admin', 0),
    (2, 'teacher', 0),
    (3, 'hod', 0),
    (4, 'student', 0)
    ON DUPLICATE KEY UPDATE User_Type_Name=VALUES(User_Type_Name)
  `);
  console.log('Seeded user_type');

  // Test Get_All_Course_Items
  const course = require('../../models/course');
  const items = await course.Get_All_Course_Items();
  console.log('Testing Get_All_Course_Items results:');
  console.log('Categories count:', items[0]?.length);
  console.log('Sections:', items[1]);
  console.log('Teachers count:', items[2]?.length);

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
