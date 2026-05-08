// seed placeholder
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('./connection');
const { User, Task, Event, MonthlyTask } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('✅ Database synced');

    // ════════════════════════════════════════
    // USERS
    // ════════════════════════════════════════
    const admin = await User.create({
      name: 'Admin', email: 'admin@qlcv.vn',
      password: 'Admin@2024', role: 'admin', color: '#6366f1'
    });

    const users = await User.bulkCreate([
      { name: 'Nguyễn Minh Hải', email: 'hai@qlcv.vn',    password: 'Hai@2024',    role: 'director', color: '#10b981', department: 'Ban Giám đốc' },
      { name: 'Trần Thị Khanh',  email: 'khanh@qlcv.vn',  password: 'Khanh@2024',  role: 'manager',  color: '#f59e0b', department: 'Ban Giám đốc' },
      { name: 'Lê Văn Điền',     email: 'dien@qlcv.vn',   password: 'Dien@2024',   role: 'manager',  color: '#ef4444', department: 'Ban Giám đốc' },
      { name: 'Phạm Quốc Vụ',    email: 'vu@qlcv.vn',     password: 'Vu@2024',     role: 'manager',  color: '#8b5cf6', department: 'Ban Giám đốc' },
      { name: 'Sương',   email: 'suong@qlcv.vn',  password: 'Suong@2024',  role: 'member', color: '#ec4899', department: 'KN&DMST' },
      { name: 'Như',     email: 'nhu@qlcv.vn',    password: 'Nhu@2024',    role: 'member', color: '#14b8a6', department: 'KN&DMST' },
      { name: 'Hương',   email: 'huong@qlcv.vn',  password: 'Huong@2024',  role: 'member', color: '#f97316', department: 'Hành chính' },
      { name: 'Khánh',   email: 'khanh2@qlcv.vn', password: 'Khanh2@2024', role: 'member', color: '#06b6d4', department: 'Hành chính' },
      { name: 'Định',    email: 'dinh@qlcv.vn',   password: 'Dinh@2024',   role: 'member', color: '#84cc16', department: 'KN&DMST' },
      { name: 'P.Anh',   email: 'panh@qlcv.vn',   password: 'Panh@2024',   role: 'member', color: '#a855f7', department: 'Kỹ thuật' },
      { name: 'Ngọc',    email: 'ngoc@qlcv.vn',   password: 'Ngoc@2024',   role: 'member', color: '#f43f5e', department: 'Hành chính' },
      { name: 'Tiên',    email: 'tien@qlcv.vn',   password: 'Tien@2024',   role: 'member', color: '#0ea5e9', department: 'KN&DMST' },
      { name: 'Trà',     email: 'tra@qlcv.vn',    password: 'Tra@2024',    role: 'member', color: '#d946ef', department: 'Truyền thông' },
      { name: 'Tùng',    email: 'tung@qlcv.vn',   password: 'Tung@2024',   role: 'member', color: '#0891b2', department: 'Kỹ thuật' },
      { name: 'Khiêm',   email: 'khiem@qlcv.vn',  password: 'Khiem@2024',  role: 'member', color: '#65a30d', department: 'Kỹ thuật' },
      { name: 'Yến',     email: 'yen@qlcv.vn',    password: 'Yen@2024',    role: 'member', color: '#b45309', department: 'Hành chính' },
      { name: 'My',      email: 'my@qlcv.vn',     password: 'My@2024',     role: 'member', color: '#7c3aed', department: 'KN&DMST' },
      { name: 'M.Thư',   email: 'mthu@qlcv.vn',   password: 'Mthu@2024',   role: 'member', color: '#be185d', department: 'KN&DMST' },
      { name: 'Trang',   email: 'trang@qlcv.vn',  password: 'Trang@2024',  role: 'member', color: '#0369a1', department: 'Hành chính' },
      { name: 'Đ.Thư',   email: 'dthu@qlcv.vn',   password: 'Dthu@2024',   role: 'member', color: '#15803d', department: 'Hành chính' },
      { name: 'Hằng',    email: 'hang@qlcv.vn',   password: 'Hang@2024',   role: 'member', color: '#b91c1c', department: 'KN&DMST' },
      { name: 'Mai',     email: 'mai@qlcv.vn',    password: 'Mai@2024',    role: 'member', color: '#92400e', department: 'Truyền thông' },
      { name: 'K.Định',  email: 'kdinh@qlcv.vn',  password: 'Kdinh@2024',  role: 'member', color: '#1d4ed8', department: 'Hành chính' },
      { name: 'Tâm',     email: 'tam@qlcv.vn',    password: 'Tam@2024',    role: 'member', color: '#059669', department: 'KN&DMST' },
      { name: 'Huy',     email: 'huy@qlcv.vn',    password: 'Huy@2024',    role: 'member', color: '#7c3aed', department: 'KN&DMST' },
    ], { individualHooks: true });

    const u = (name) => users.find(x => x.name === name) || admin;
    const ids = (...names) => JSON.stringify(names.map(n => u(n).id));

    const now  = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    const pad  = n => String(n).padStart(2,'0');
    const d    = (day, m=month) => `${year}-${pad(m)}-${pad(day)}`;

    // ════════════════════════════════════════
    // ADM-01 — Thủ tục Tổ chức
    // ════════════════════════════════════════
    await Task.create({ taskCode:'ADM-01', parentCode:null, workCategory:'ADM', taskName:'Thủ tục Tổ chức', leadDepartment:'LD-INNO', deputyDirector:'GĐ-Hải', deadline:d(29), taskType:'R', status:'in_progress', progress:80, month, year, createdById:admin.id });
    await Task.bulkCreate([
      { taskCode:'ADM-01.01', parentCode:'ADM-01', workCategory:'ADM', taskName:'Lập kế hoạch tổ chức Hội thảo', leadDepartment:'LD-INNO', assigneeId:u('Sương').id, collaborators:ids('Như'), deputyDirector:'GĐ-Hải', deadline:d(16,4), deliverable:'Kế hoạch trình lãnh đạo Sở ký ban hành', taskType:'R', status:'done', completion:'OT', progress:100, month, year, createdById:admin.id },
      { taskCode:'ADM-01.03', parentCode:'ADM-01', workCategory:'ADM', taskName:'Soạn thảo và trình ký công văn mời phối hợp tổ chức Hội thảo', leadDepartment:'LD-INNO', assigneeId:u('Như').id, collaborators:ids('Sương'), deputyDirector:'GĐ-Hải', deadline:d(20,4), deliverable:'Công văn mời phối hợp tổ chức đã phát hành', taskType:'R', status:'done', completion:'OT', progress:100, month, year, createdById:admin.id },
      { taskCode:'ADM-01.04', parentCode:'ADM-01', workCategory:'ADM', taskName:'Xây dựng và trình ký bộ thủ tục xin chủ trương Ủy ban tổ chức hội thảo', leadDepartment:'LD-INNO', assigneeId:u('Như').id, collaborators:ids('Sương'), deputyDirector:'GĐ-Hải', deadline:d(20,4), deliverable:'Công văn xin chủ trương UB tổ chức Hội thảo đã phát hành', taskType:'R', status:'done', completion:'OT', progress:100, month, year, createdById:admin.id },
      { taskCode:'ADM-01.05', parentCode:'ADM-01', workCategory:'ADM', taskName:'Hoàn thiện bảng phân công công việc và quản lý tiến độ tổ chức', leadDepartment:'LD-INNO', assigneeId:u('Sương').id, collaborators:ids('Như'), deputyDirector:'GĐ-Hải', deadline:d(19,4), deliverable:'Bảng phân công phát hành', taskType:'R', status:'done', completion:'OT', progress:100, month, year, createdById:admin.id },
      { taskCode:'ADM-01.06', parentCode:'ADM-01', workCategory:'ADM', taskName:'Theo dõi văn bản thống nhất chủ trương UB ký', leadDepartment:'LD-BOD', deputyDirector:'PGĐ-Khanh', deadline:d(29,4), deliverable:'Văn bản thống nhất chủ trương tổ chức Hội thảo của UBND', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
    ]);

    // ════════════════════════════════════════
    // ADM-02 — Thủ tục tài chính
    // ════════════════════════════════════════
    await Task.create({ taskCode:'ADM-02', parentCode:null, workCategory:'ADM', taskName:'Thủ tục tài chính', leadDepartment:'LD-SER', deputyDirector:'PGĐ-Khanh', deadline:d(8,5), taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id });
    await Task.bulkCreate([
      { taskCode:'ADM-02.01', parentCode:'ADM-02', workCategory:'ADM', taskName:'Phân công tổ chức lấy báo giá các gói dịch vụ liên quan', leadDepartment:'LD-SER', assigneeId:u('Hương').id, collaborators:ids('Định','P.Anh','Ngọc','Tiên'), deputyDirector:'PGĐ-Khanh', deadline:d(23,4), deliverable:'Tập hợp đầy đủ các báo giá liên quan theo dự trù kinh phí tại Kế hoạch', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'ADM-02.02', parentCode:'ADM-02', workCategory:'ADM', taskName:'Xây dựng thủ tục trình thẩm định kinh phí (công văn + tờ trình)', leadDepartment:'LD-SER', assigneeId:u('Hương').id, collaborators:ids('Khánh'), deputyDirector:'PGĐ-Khanh', deadline:d(23,4), deliverable:'Công văn, tờ trình thẩm định kinh phí trình Sở ký phát hành', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'ADM-02.03', parentCode:'ADM-02', workCategory:'ADM', taskName:'Theo dõi văn bản phê duyệt kinh phí', leadDepartment:'LD-ADM', assigneeId:u('Khánh').id, deputyDirector:'PGĐ-Khanh', deadline:d(8,5), deliverable:'Văn bản phê duyệt kinh phí tổ chức hội thảo', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
    ]);

    // ════════════════════════════════════════
    // CON-01 — Chương trình
    // ════════════════════════════════════════
    await Task.create({ taskCode:'CON-01', parentCode:null, workCategory:'CON', taskName:'Chương trình', leadDepartment:'LD-INNO', deputyDirector:'GĐ-Hải', deadline:d(29,4), taskType:'R', status:'in_progress', progress:40, month, year, createdById:admin.id });
    await Task.bulkCreate([
      { taskCode:'CON-01.01', parentCode:'CON-01', workCategory:'CON', taskName:'Xây dựng chương trình tổng thể', leadDepartment:'LD-INNO', assigneeId:u('Sương').id, collaborators:ids('Như'), deputyDirector:'GĐ-Hải', deadline:d(22,4), deliverable:'Chương trình Hội thảo được sự thống nhất của BGĐ', taskType:'R', status:'in_progress', progress:60, month, year, createdById:admin.id },
      { taskCode:'CON-01.02', parentCode:'CON-01', workCategory:'CON', taskName:'Thiết kế thư mời + bao thư mời', leadDepartment:'LD-INNO', assigneeId:u('Như').id, collaborators:ids('Như'), deputyDirector:'GĐ-Hải', deadline:d(22,4), deliverable:'Mẫu thư mời + bao thư được BGĐ thống nhất', taskType:'R', status:'in_progress', progress:50, month, year, createdById:admin.id },
      { taskCode:'CON-01.03', parentCode:'CON-01', workCategory:'CON', taskName:'Trình ký thư mời Hội thảo (Thư mời + công văn trình UBND ký thư mời)', leadDepartment:'LD-INNO', assigneeId:u('Như').id, deputyDirector:'GĐ-Hải', deadline:d(29,4), deliverable:'1- Thư mời bản giấy đã ký\n2- Thư mời bản online đã ký', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'CON-01.04', parentCode:'CON-01', workCategory:'CON', taskName:'Thống kê số lượng thư mời màu cần in ấn phát hành, báo cáo số lượng dự kiến in ấn và tiến hành in, đóng dấu', leadDepartment:'LD-INNO', assigneeId:u('Như').id, collaborators:ids('My'), deputyDirector:'GĐ-Hải', deadline:d(6,5), deliverable:'Thư mời màu bản in sẵn sàng phát hành', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'CON-01.05', parentCode:'CON-01', workCategory:'CON', taskName:'Liên hệ MC và làm việc về nội dung sự kiện', leadDepartment:'LD-INNO', assigneeId:u('Sương').id, deputyDirector:'GĐ-Hải', deadline:d(15,5), deliverable:'Dự kiến 02 MC (song ngữ)', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'CON-01.06', parentCode:'CON-01', workCategory:'CON', taskName:'Xây dựng kịch bản MC - kỹ thuật', leadDepartment:'LD-INNO', assigneeId:u('Sương').id, deputyDirector:'GĐ-Hải', deadline:d(15,5), deliverable:'Phát hành kịch bản đến MC và bộ phận kỹ thuật', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'CON-01.07', parentCode:'CON-01', workCategory:'CON', taskName:'Sơ đồ lãnh đạo thực hiện nghi thức công bố, ký kết', leadDepartment:'LD-INNO', assigneeId:u('Như').id, collaborators:ids('Như'), deputyDirector:'GĐ-Hải', deadline:d(15,5), deliverable:'Sơ đồ được BGĐ thống nhất\nCông bố sơ đồ đến bộ phận TEC', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'CON-01.08', parentCode:'CON-01', workCategory:'CON', taskName:'Điều phối chạy chương trình', leadDepartment:'LD-INNO', assigneeId:u('Sương').id, collaborators:ids('Như','My','Yến','Hương','Tùng'), deputyDirector:'GĐ-Hải', deadline:d(24,5), deliverable:'Đảm bảo nội dung chạy chương trình:\n1- Văn nghệ\n2- Nghi thức công bố lễ ra mắt\n3- Backdrop, video, tham luận trình chiếu', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'CON-01.09', parentCode:'CON-01', workCategory:'CON', taskName:'Bố trí bảng tên lãnh đạo, khách mời, đơn vị tham gia ký kết tại sự kiện', leadDepartment:'LD-INNO', assigneeId:u('Sương').id, collaborators:ids('Như','M.Thư'), deputyDirector:'GĐ-Hải', deadline:d(24,5), deliverable:'Bố trí bảng tên và báo cáo BGĐ', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'CON-01.10', parentCode:'CON-01', workCategory:'CON', taskName:'Phụ trách khu vực sân khấu về nội dung sự kiện', leadDepartment:'LD-INNO', assigneeId:u('Sương').id, collaborators:ids('Như'), deputyDirector:'GĐ-Hải', deadline:d(25,5), deliverable:'Xử lý các vấn đề phát sinh từ lãnh đạo, chương trình, nội dung', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'CON-01.11', parentCode:'CON-01', workCategory:'CON', taskName:'Hướng dẫn lãnh đạo vào vị trí thực hiện nghi thức công bố', leadDepartment:'LD-INNO', assigneeId:u('Như').id, collaborators:ids('Trang','M.Thư','Tiên'), deputyDirector:'GĐ-Hải', deadline:d(25,5), deliverable:'Lãnh đạo đứng đúng vị trí', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'CON-01.12', parentCode:'CON-01', workCategory:'CON', taskName:'Đứng phục vụ nghi thức ký kết hợp tác', leadDepartment:'LD-INNO', assigneeId:u('Như').id, collaborators:ids('Trang'), deputyDirector:'GĐ-Hải', deadline:d(25,5), deliverable:'', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'CON-01.13', parentCode:'CON-01', workCategory:'CON', taskName:'Bố trí bảng tên, bộ VPP thực hiện ký kết tại sân khấu', leadDepartment:'LD-INNO', assigneeId:u('Tiên').id, collaborators:ids('Hằng'), deputyDirector:'GĐ-Hải', deadline:d(25,5), deliverable:'Bố trí theo sơ đồ đã được thống nhất', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
    ]);

    // ════════════════════════════════════════
    // COM-01 — Hạng mục thiết kế, ấn phẩm truyền thông
    // ════════════════════════════════════════
    await Task.create({ taskCode:'COM-01', parentCode:null, workCategory:'COM', taskName:'Hạng mục thiết kế, ấn phẩm truyền thông', leadDepartment:'LD-COM', deputyDirector:'PGĐ-Điền', deadline:d(20,5), taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id });
    await Task.bulkCreate([
      { taskCode:'COM-01.01', parentCode:'COM-01', workCategory:'COM', taskName:'Thiết kế backdrop Hội thảo', leadDepartment:'LD-COM', assigneeId:u('Trà').id, deputyDirector:'PGĐ-Điền', deadline:d(6,5), deliverable:'Maket backdrop được BGĐ thống nhất', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-01.03', parentCode:'COM-01', workCategory:'COM', taskName:'Thiết kế backdrop chụp hình Hội thảo', leadDepartment:'LD-COM', assigneeId:u('Trà').id, deputyDirector:'PGĐ-Điền', deadline:d(6,5), deliverable:'Maket backdrop chụp hình được BGĐ thống nhất', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-01.04', parentCode:'COM-01', workCategory:'COM', taskName:'Thiết kế băng rôn, phướn', leadDepartment:'LD-COM', assigneeId:u('Trà').id, deputyDirector:'PGĐ-Điền', deadline:d(6,5), deliverable:'Maket phướn, băng rôn chụp hình được BGĐ thống nhất', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-01.05', parentCode:'COM-01', workCategory:'COM', taskName:'Lập danh sách các tuyến đường treo phướn, băng rôn xin ý kiến BGĐ', leadDepartment:'LD-COM', assigneeId:u('Trà').id, collaborators:ids('Mai'), deputyDirector:'PGĐ-Điền', deadline:d(6,5), deliverable:'Danh sách các tuyến đường treo phướn, băng rôn được BGĐ thống nhất', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-01.06', parentCode:'COM-01', workCategory:'COM', taskName:'Soạn thảo và trình ký thủ tục treo băng rôn (sau khi kinh phí được cấp)', leadDepartment:'LD-COM', assigneeId:u('Trà').id, collaborators:ids('Như'), deputyDirector:'PGĐ-Điền', deadline:d(11,5), deliverable:'Công văn xin phép treo phướn, băng rôn trình GĐ Sở ký phát hành', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-01.07', parentCode:'COM-01', workCategory:'COM', taskName:'Liên hệ Sở VH hỗ trợ thủ tục cấp giấy phép treo phướn, băng rôn trước thời điểm diễn ra sự kiện', leadDepartment:'LD-COM', assigneeId:u('Trà').id, deputyDirector:'PGĐ-Điền', deadline:d(15,5), deliverable:'Giấy phép treo phướn, băng rôn (thời gian treo từ 19 - 26/5)', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-01.08', parentCode:'COM-01', workCategory:'COM', taskName:'Thiết kế Cổng hội, maket gian trưng bày (6 đơn vị)', leadDepartment:'LD-COM', assigneeId:u('Trà').id, collaborators:ids('P.Anh','Tùng','Khiêm'), deputyDirector:'PGĐ-Điền', deadline:d(8,5), deliverable:'Maket cổng hội, gian hàng được BGĐ thống nhất', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-01.09', parentCode:'COM-01', workCategory:'COM', taskName:'Thiết kế backdrop lãnh đạo phát biểu', leadDepartment:'LD-COM', assigneeId:u('Trà').id, deputyDirector:'PGĐ-Điền', deadline:d(18,5), deliverable:'1- Lãnh đạo Ban tuyên giáo và dân vận TW\n2- Lãnh đạo Bộ KH&CN\n3- Lãnh đạo Thành ủy (dự trù lãnh đạo UBND)', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-01.10', parentCode:'COM-01', workCategory:'COM', taskName:'Thiết kế + in ấn bảng tên để bàn', leadDepartment:'LD-COM', assigneeId:u('Trà').id, collaborators:ids('P.Anh'), deputyDirector:'PGĐ-Điền', deadline:d(20,5), deliverable:'1- Bảng tên VIP\n2- Bảng tên BCV\n3- Bảng tên đơn vị trưng bày\n4- Bảng tên đơn vị tham gia ký kết\n5- Bảng tên lãnh đạo khác', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-01.11', parentCode:'COM-01', workCategory:'COM', taskName:'Thiết kế + in ấn thẻ đeo VIP, BCV, đại biểu, BTC', leadDepartment:'LD-COM', assigneeId:u('Trà').id, collaborators:ids('P.Anh'), deputyDirector:'PGĐ-Điền', deadline:d(20,5), deliverable:'Số lượng in được BGĐ thống nhất (đính kèm danh sách phát thẻ đeo)', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-01.12', parentCode:'COM-01', workCategory:'COM', taskName:'Thiết kế thư mời cơm tối (24/5)', leadDepartment:'LD-COM', assigneeId:u('Trà').id, collaborators:ids('P.Anh'), deputyDirector:'PGĐ-Điền', deadline:d(20,5), deliverable:'Bản thư mời cơm được BGĐ thống nhất, xuất file linh hoạt để bộ phận phụ trách mời có thể tự điền thời gian, địa điểm', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-01.13', parentCode:'COM-01', workCategory:'COM', taskName:'Thiết kế và in ấn thư cảm ơn (chỉ in ấn gửi VIP, xin ý kiến BGĐ về số lượng in)', leadDepartment:'LD-COM', assigneeId:u('Trà').id, collaborators:ids('P.Anh'), deputyDirector:'PGĐ-Điền', deadline:d(20,5), deliverable:'Thư cảm ơn bản giấy và bản online sẵn sàng phát hành', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
    ]);

    // ════════════════════════════════════════
    // COM-02 — Đại biểu tham dự
    // ════════════════════════════════════════
    await Task.create({ taskCode:'COM-02', parentCode:null, workCategory:'COM', taskName:'Đại biểu tham dự', leadDepartment:'LD-SER', deputyDirector:'PGĐ-Vụ', deadline:d(25,5), taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id });
    await Task.bulkCreate([
      { taskCode:'COM-02.01', parentCode:'COM-02', workCategory:'COM', taskName:'Xây dựng và trình ký công văn: 1- Mời tham dự\n2- Mời đối tác trưng bày\n3- Mời phối hợp vận động tham dự', leadDepartment:'LD-SER', assigneeId:u('Hương').id, collaborators:ids('Tiên'), deputyDirector:'PGĐ-Vụ', deadline:d(5,5), deliverable:'Công văn được GĐ sở ký phát hành', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-02.02', parentCode:'COM-02', workCategory:'COM', taskName:'Lập danh sách gửi thư mời tham dự Hội thảo', leadDepartment:'LD-SER', assigneeId:u('Hương').id, collaborators:ids('K.Định','Ngọc'), deputyDirector:'PGĐ-Vụ', deadline:d(5,5), deliverable:'Danh sách gửi thư mời tham dự Hội thảo trình BGĐ thống nhất', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-02.03', parentCode:'COM-02', workCategory:'COM', taskName:'Phát hành thư mời Hội thảo theo danh sách', leadDepartment:'LD-SER', assigneeId:u('Hương').id, collaborators:ids('K.Định','Trang','Đ.Thư'), deputyDirector:'PGĐ-Vụ', deadline:d(8,5), deliverable:'', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-02.04', parentCode:'COM-02', workCategory:'COM', taskName:'Liên hệ xác nhận thông tin đại biểu tham dự', leadDepartment:'LD-SER', assigneeId:u('Hương').id, collaborators:ids('K.Định','Trang','Đ.Thư'), deputyDirector:'PGĐ-Vụ', deadline:d(18,5), deliverable:'Danh sách đại biểu xác nhận tham dự tổng hợp và phân bổ theo đối tượng', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-02.05', parentCode:'COM-02', workCategory:'COM', taskName:'Liên hệ xác nhận danh sách sinh viên tham dự từ các trường ĐH mời phối hợp', leadDepartment:'LD-SER', assigneeId:u('Hương').id, collaborators:ids('Ngọc'), deputyDirector:'PGĐ-Vụ', deadline:d(19,5), deliverable:'Danh sách sinh viên xác nhận tham dự + đầu mối quản lý sinh viên', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-02.06', parentCode:'COM-02', workCategory:'COM', taskName:'Tạo group zalo để sinh viên các trường xác nhận tham dự tại group', leadDepartment:'LD-SER', assigneeId:u('Hương').id, collaborators:ids('Ngọc'), deputyDirector:'PGĐ-Vụ', deadline:d(20,5), deliverable:'Group zalo tập hợp các sinh viên xác nhận tham dự, gửi thông tin chương trình lên group', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-02.07', parentCode:'COM-02', workCategory:'COM', taskName:'Xây dựng phương án bố trí vị trí/dãy ghế ngồi cho từng đối tượng tham dự', leadDepartment:'LD-SER', assigneeId:u('Hương').id, collaborators:ids('Ngọc','P.Anh'), deputyDirector:'PGĐ-Vụ', deadline:d(18,5), deliverable:'Phương án bố trí: VIP, BCV, Lãnh đạo Sở, ngành, địa phương, viện trường, doanh nghiệp, đại biểu khác', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-02.08', parentCode:'COM-02', workCategory:'COM', taskName:'Lập mã số ghế, dãy ghế, in ấn và dán sau ghế ngồi', leadDepartment:'LD-SER', assigneeId:u('Ngọc').id, collaborators:ids('Yến','Đ.Thư','Trà'), deputyDirector:'PGĐ-Vụ', deadline:d(19,5), deliverable:'Cấu trúc mã ghế hoàn chỉnh: [Khu]-[Dãy]-[Ghế]', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-02.09', parentCode:'COM-02', workCategory:'COM', taskName:'Phụ trách checkin đại biểu', leadDepartment:'LD-SER', assigneeId:u('Hương').id, collaborators:ids('K.Định','Trang','Đ.Thư','My'), deputyDirector:'PGĐ-Vụ', deadline:d(25,5), deliverable:'1- Hướng dẫn ký tên\n2- Phát thẻ đeo BCV, BTC, Trưng bày\n3- Phát mã số ghế ngồi\n4- Hướng dẫn quét QR tài liệu', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-02.10', parentCode:'COM-02', workCategory:'COM', taskName:'Hướng dẫn đại biểu vào vị trí ghế và ổn định Hội trường', leadDepartment:'LD-SER', assigneeId:u('Ngọc').id, collaborators:ids('Như','M.Thư'), deputyDirector:'PGĐ-Vụ', deadline:d(25,5), deliverable:'', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'COM-02.11', parentCode:'COM-02', workCategory:'COM', taskName:'Hồ sơ thanh toán đại biểu tham dự', leadDepartment:'LD-SER', assigneeId:u('Hương').id, collaborators:ids('Ngọc','K.Định'), deputyDirector:'PGĐ-Vụ', deadline:d(25,5), deliverable:'Danh sách đại biểu tham dự ký tên', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
    ]);

    // ════════════════════════════════════════
    // TEC-01 — Chuẩn bị Hội trường, trang trí, trưng bày
    // ════════════════════════════════════════
    await Task.create({ taskCode:'TEC-01', parentCode:null, workCategory:'TEC', taskName:'Chuẩn bị Hội trường, trang trí, trưng bày', leadDepartment:'LD-ADM', deputyDirector:'PGĐ-Điền', deadline:d(25,5), taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id });
    await Task.bulkCreate([
      { taskCode:'TEC-01.01', parentCode:'TEC-01', workCategory:'TEC', taskName:'Liên hệ Hội trường tổ chức Hội thảo + mời đơn vị thi công đo đạc kích thước gian hàng, cổng hội, backdrop, logo...', leadDepartment:'LD-SER', assigneeId:u('Tùng').id, collaborators:ids('P.Anh','Khiêm'), deputyDirector:'PGĐ-Điền', deadline:d(23,4), deliverable:'Báo cáo phương án tổ chức Hội thảo:\n1- Hội trường tổ chức\n2- Hình thức bố trí bàn ghế\n3- Kích thước cổng hội và vị trí đặt cổng', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'TEC-01.02', parentCode:'TEC-01', workCategory:'TEC', taskName:'Xây dựng Phương án bố trí bàn ghế, phương án trưng bày (bao gồm nối điện đến từng gian), phương án trang trí (backdrop chụp hình, logo, cổng hội), khu trình diễn thực tế ảo, vị trí bố trí màn hình chân quỳ, robot', leadDepartment:'LD-ADM', assigneeId:u('Tùng').id, collaborators:ids('P.Anh','Khiêm'), deputyDirector:'PGĐ-Điền', deadline:d(24,4), deliverable:'Phương án được BGĐ thống nhất', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'TEC-01.03', parentCode:'TEC-01', workCategory:'TEC', taskName:'Xin ý kiến BGĐ về số lượng, loại robot cần thuê. Làm việc với đối tác thuê robot phục vụ sự kiện', leadDepartment:'LD-SER', assigneeId:u('P.Anh').id, collaborators:ids('Khiêm'), deputyDirector:'PGĐ-Điền', deadline:d(8,5), deliverable:'Đảm bảo số lượng robot, loại robot có mặt tại sự kiện và vận hành ổn định', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'TEC-01.04', parentCode:'TEC-01', workCategory:'TEC', taskName:'Xin ý kiến BGĐ về số lượng, loại màn hình chân quỳ cần thuê. Làm việc với đối tác thuê màn hình chân quỳ phục vụ sự kiện', leadDepartment:'LD-SER', assigneeId:u('P.Anh').id, collaborators:ids('Khiêm','Tùng'), deputyDirector:'PGĐ-Điền', deadline:d(8,5), deliverable:'Hình ảnh, trang, video trình chiếu trên màn hình chân quỳ đã xin ý kiến và được BGĐ thống nhất', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'TEC-01.05', parentCode:'TEC-01', workCategory:'TEC', taskName:'Làm việc với đơn vị thi công triển khai thi công cổng hội, backdrop chụp hình, logo, 6 gian trưng bày (bao gồm nối điện đến từng gian) và các hạng mục khác theo thiết kế', leadDepartment:'LD-ADM', assigneeId:u('Tùng').id, collaborators:ids('P.Anh','Khiêm'), deputyDirector:'PGĐ-Điền', deadline:d(14,5), deliverable:'Phương án cổng hội vận hành trong thời gian sự kiện\nĐảm bảo thi công backdrop, logo đúng chất liệu, kích thước', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'TEC-01.06', parentCode:'TEC-01', workCategory:'TEC', taskName:'Làm việc với đơn vị cung cấp dịch vụ led sân khấu', leadDepartment:'LD-ADM', assigneeId:u('Tùng').id, collaborators:ids('P.Anh','Khiêm'), deputyDirector:'PGĐ-Điền', deadline:d(7,5), deliverable:'Phương án lắp led sân khấu', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'TEC-01.07', parentCode:'TEC-01', workCategory:'TEC', taskName:'Tập hợp các hình ảnh, trang liên quan để setup chạy trên màn hình chân quỳ', leadDepartment:'LD-SER', assigneeId:u('P.Anh').id, deputyDirector:'PGĐ-Điền', deadline:d(7,5), deliverable:'Hình ảnh, trang, video trình chiếu trên màn hình chân quỳ theo phương án BGĐ thống nhất', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'TEC-01.08', parentCode:'TEC-01', workCategory:'TEC', taskName:'Theo dõi tiến độ và chất lượng thi công cổng led, cổng hội, gian hàng, backdrop chụp hình', leadDepartment:'LD-ADM', assigneeId:u('Tùng').id, collaborators:ids('P.Anh','Khiêm'), deputyDirector:'PGĐ-Điền', deadline:d(24,5), deliverable:'Đảm bảo thi công theo thiết kế', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'TEC-01.09', parentCode:'TEC-01', workCategory:'TEC', taskName:'Phụ trách vấn đề kỹ thuật, đèn, điện trong thời gian sự kiện', leadDepartment:'LD-ADM', assigneeId:u('Tùng').id, collaborators:ids('P.Anh','Khiêm'), deputyDirector:'PGĐ-Điền', deadline:d(25,5), deliverable:'', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
      { taskCode:'TEC-01.10', parentCode:'TEC-01', workCategory:'TEC', taskName:'Công tác vệ sinh Hội trường và khu vực trưng bày, tham quan', leadDepartment:'LD-ADM', assigneeId:u('Tùng').id, collaborators:ids('P.Anh','Khiêm'), deputyDirector:'PGĐ-Điền', deadline:d(25,5), deliverable:'Đảm bảo vệ sinh toàn khu sự kiện trước và trong thời điểm sự kiện', taskType:'R', status:'not_started', progress:0, month, year, createdById:admin.id },
    ]);

    // ════════════════════════════════════════
    // EVENTS (lịch)
    // ════════════════════════════════════════
    await Event.bulkCreate([
      { title:'Hội thảo Khởi nghiệp & ĐMST', type:'other', color:'#6366f1', startDate:new Date(year,4,25,8,0), month:5, year, allDay:false, description:'Sự kiện hội thảo chính - 8:00 ngày 25/5/2026', createdById:admin.id },
      { title:'Deadline nộp báo giá dịch vụ', type:'deadline', color:'#ef4444', startDate:new Date(year,3,23), month:4, year, allDay:true, description:'Hạn nộp báo giá ADM-02.01', createdById:admin.id },
      { title:'Deadline UB ký văn bản chủ trương', type:'deadline', color:'#f59e0b', startDate:new Date(year,3,29), month:4, year, allDay:true, description:'ADM-01.06', createdById:admin.id },
      { title:'Họp giao ban tháng 4', type:'meeting', color:'#10b981', startDate:new Date(year,3,5,8,0), month:4, year, allDay:false, description:'Họp giao ban định kỳ', createdById:admin.id },
      { title:'Deadline thiết kế backdrop', type:'deadline', color:'#ec4899', startDate:new Date(year,4,6), month:5, year, allDay:true, description:'COM-01.01, COM-01.03, COM-01.04', createdById:admin.id },
      { title:'Deadline phát hành thư mời', type:'deadline', color:'#8b5cf6', startDate:new Date(year,4,8), month:5, year, allDay:true, description:'COM-02.03', createdById:admin.id },
    ]);

    // ════════════════════════════════════════
    // MONTHLY TASKS — Tháng 4 (hiện tại)
    // ════════════════════════════════════════
    await MonthlyTask.bulkCreate([
      { taskId:'KN-TT-001', taskName:'Cập nhật tin Diễn đàn khởi nghiệp', startDate:`${year}-04-02`, dueDate:`${year}-04-25`, assigneeId:u('Như').id, taskType:'R', completion:'OT', progress:100, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:1, month:4, year, createdById:admin.id },
      { taskId:'KN-IT-002', taskName:'Hoàn thiện chức năng và giao diện Sàn giao dịch', startDate:`${year}-04-07`, dueDate:`${year}-04-13`, extendedDueDate:`${year}-04-20`, assigneeId:u('P.Anh').id, taskType:'R', completion:'OD', progress:40, notes:'Gia hạn do yêu cầu thay đổi giao diện', taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:2, month:4, year, createdById:admin.id },
      { taskId:'KN-TT-003', taskName:'Truyền thông fanpage, zalo (02 bài/tuần)', startDate:`${year}-04-02`, dueDate:`${year}-04-27`, assigneeId:u('Tiên').id, taskType:'R', completion:'OT', progress:100, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:3, month:4, year, createdById:admin.id },
      { taskId:'KN-DB-004', taskName:'Cập nhật cơ sở dữ liệu Viện, trường, startup', startDate:`${year}-04-02`, dueDate:`${year}-04-13`, assigneeId:u('Tiên').id, taskType:'R', completion:'OT', progress:100, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:4, month:4, year, createdById:admin.id },
      { taskId:'KN-KH-005', taskName:'Chỉnh sửa kế hoạch khai thác trụ sở Casic Local Hub', startDate:`${year}-04-03`, dueDate:`${year}-04-05`, assigneeId:u('Như').id, taskType:'A', completion:'OT', progress:100, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:5, month:4, year, createdById:admin.id },
      { taskId:'ADM-PS-001', taskName:'Soạn thảo báo cáo tổng kết tháng 4', startDate:`${year}-04-25`, dueDate:`${year}-04-28`, assigneeId:u('Hương').id, taskType:'A', completion:null, progress:30, taskGroup:'PHAT_SINH', department:'Hành chính', stt:1, month:4, year, createdById:admin.id },
      { taskId:'ADM-PS-002', taskName:'Chuẩn bị hồ sơ kiểm tra định kỳ', startDate:`${year}-04-20`, dueDate:`${year}-04-28`, assigneeId:u('Khánh').id, taskType:'A', completion:null, progress:50, taskGroup:'PHAT_SINH', department:'Hành chính', stt:2, month:4, year, createdById:admin.id },
    ]);

    // ════════════════════════════════════════
    // MONTHLY TASKS — Tháng 2/2026
    // ════════════════════════════════════════
    const y2 = year; // 2026
    const d2 = (day, m=2) => `${y2}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

    await MonthlyTask.bulkCreate([
      // ── NHIỆM VỤ THƯỜNG XUYÊN ──
      { taskId:'KN_TT_02_01', taskName:'Cập nhật tin Diễn đàn khởi nghiệp', startDate:d2(2), dueDate:d2(25), assigneeId:u('Như').id, taskType:'R', completion:'OT', progress:100, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:2, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_IT_02_01a', taskName:'Cập nhật cơ sở dữ liệu Sàn giao dịch', startDate:d2(7), dueDate:d2(13), extendedDueDate:d2(16,3), assigneeId:u('Huy') ? u('Huy').id : admin.id, taskType:'R', completion:'OD', progress:0, notes:'Chưa gửi sản phẩm, gia hạn sang 16/3', taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:3, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_IT_02_01b', taskName:'Hoàn thiện chức năng và giao diện Sàn giao dịch', startDate:d2(7), dueDate:d2(13), extendedDueDate:d2(16,3), assigneeId:u('P.Anh').id, taskType:'R', completion:'OD', progress:40, notes:'Ngày gửi sản phẩm: 16/2', taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:3, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_IT_02_01c', taskName:'Trình ký quy chế hoạt động sàn giao dịch', startDate:d2(7), dueDate:d2(13), extendedDueDate:d2(16,3), assigneeId:u('Như').id, taskType:'R', completion:'OD', progress:40, notes:'Ngày gửi sản phẩm: 23/2', taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:3, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_TT_02_02', taskName:'Truyền thông fanpage, zalo (02 bài/tuần)', startDate:d2(2), dueDate:d2(27), assigneeId:u('Tiên').id, taskType:'R', completion:'OT', progress:100, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:4, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_K_02_02', taskName:'Cập nhật cơ sở dữ liệu Viện, trường, startup', startDate:d2(2), dueDate:d2(13), assigneeId:u('Tiên').id, taskType:'R', completion:'OT', progress:100, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:5, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_KH_02_01a', taskName:'Chỉnh sửa kế hoạch khai thác trụ sở Casic Local Hub - Lần 1', startDate:d2(3), dueDate:d2(5), assigneeId:u('Như').id, taskType:'A', completion:'OT', progress:60, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:6, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_KH_02_01b', taskName:'Chỉnh sửa kế hoạch khai thác trụ sở Casic Local Hub - Lần 1 (P.Anh)', startDate:d2(3), dueDate:d2(5), assigneeId:u('P.Anh').id, taskType:'A', completion:null, progress:0, notes:'Điều chỉnh phân công không thực hiện vì lý do việc gia đình', taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:6, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_CV_02_01', taskName:'Tham mưu phản hồi CV đề xuất danh mục nội dung hợp tác giữa UBND TPCT và ĐH Kinh tế TPHCM', startDate:d2(5), dueDate:d2(6), assigneeId:u('Như').id, taskType:'R', completion:'OT', progress:90, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:7, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_CV_02_02', taskName:'Tham mưu phản hồi CV 158 của Sở Tư pháp về rà soát văn bản quy phạm pháp luật (Nghị quyết 11)', startDate:d2(9), dueDate:d2(6,3), assigneeId:u('Như').id, taskType:'R', completion:null, progress:0, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:8, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_KH_02_02', taskName:'Lập Kế hoạch cập nhật tin Diễn đàn canthostartup.vn', startDate:d2(24), dueDate:d2(26), assigneeId:u('Tiên').id, taskType:'R', completion:'OT', progress:40, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:9, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_TC_02_01a', taskName:'Phân chia gói các Báo giá KH 2026', startDate:d2(23), dueDate:d2(24), assigneeId:u('Sương').id, taskType:'R', completion:'OT', progress:0, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:10, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_TC_02_01b', taskName:'Liên hệ Báo giá KH 2026 - Gói Trang trí, thuê xe, video', startDate:d2(24), dueDate:d2(27), extendedDueDate:d2(5,3), assigneeId:u('P.Anh').id, taskType:'R', completion:null, progress:0, notes:'Gia hạn thời gian do kế hoạch thay đổi ngày 26/3', taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:10, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_TC_02_01c', taskName:'Liên hệ Báo giá KH 2026 - Gói CNTT, tên miền, hội trường', startDate:d2(24), dueDate:d2(27), extendedDueDate:d2(5,3), assigneeId:u('Như').id, taskType:'R', completion:null, progress:0, notes:'Gia hạn thời gian do kế hoạch thay đổi ngày 26/3', taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:10, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_K_02_04', taskName:'Xây dựng bảng dự kiến tiến độ công việc KH 2026, phân công thực hiện', startDate:d2(24), dueDate:d2(27), assigneeId:u('Sương').id, taskType:'R', completion:'OT', progress:0, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:11, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_K_02_05', taskName:'Xây dựng bảng phân công cập nhật tin Diễn đàn, startup247 2026', startDate:d2(27), dueDate:d2(27), assigneeId:u('Như').id, taskType:'R', completion:'OT', progress:100, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:12, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_KH_02_01c', taskName:'Chỉnh sửa kế hoạch khai thác trụ sở Casic Local Hub - Lần 2', startDate:d2(16), dueDate:d2(10,3), assigneeId:u('Sương').id, taskType:'R', completion:null, progress:0, taskGroup:'THUONG_XUYEN', department:'KN&DMST', stt:13, month:2, year:y2, createdById:admin.id },

      // ── ĐỀ TÀI ──
      { taskId:'KN_DA_02_01', taskName:'Thực hiện bộ thủ tục thầu gói Thiết kế mô hình ươm tạo và tăng tốc', startDate:d2(3,1), dueDate:d2(9), assigneeId:u('Sương').id, taskType:'R', completion:'OT', progress:0, taskGroup:'PHAT_SINH', department:'KN&DMST', stt:1, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_DA_02_02', taskName:'Theo dõi tiến độ và thực hiện thủ tục Nghiệm thu thanh lý Hợp đồng thầu Thiết kế mô hình ươm tạo', startDate:d2(24), dueDate:d2(10,3), assigneeId:u('Như').id, taskType:'R', completion:null, progress:0, taskGroup:'PHAT_SINH', department:'KN&DMST', stt:2, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_DA_02_03', taskName:'Soạn thảo Hợp đồng công lao động 02 chuyên đề 14 + 15', startDate:d2(24), dueDate:d2(28), assigneeId:u('Sương').id, taskType:'R', completion:'OT', progress:0, taskGroup:'PHAT_SINH', department:'KN&DMST', stt:3, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_DA_02_04', taskName:'Soạn thảo 03 kế hoạch tổ chức 03 chương trình đào tạo ĐMST trong doanh nghiệp (kế hoạch, công văn phối hợp, công văn chiêu sinh, phương án tổ chức)', startDate:d2(24), dueDate:d2(26), assigneeId:u('Sương').id, taskType:'R', completion:'OT', progress:0, taskGroup:'PHAT_SINH', department:'KN&DMST', stt:4, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_DA_02_05', taskName:'Soạn thảo kế hoạch và bộ hồ sơ thầu gói Video', startDate:d2(24), dueDate:d2(28), assigneeId:u('Sương').id, taskType:'R', completion:'OT', progress:0, taskGroup:'PHAT_SINH', department:'KN&DMST', stt:5, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_DA_02_06', taskName:'Viết báo cáo Nghiên cứu xây dựng đề án thành lập mạng lưới cộng đồng khởi nghiệp và đổi mới sáng tạo trên các lĩnh vực trọng tâm của thành phố Cần Thơ', startDate:d2(16), dueDate:d2(25,3), assigneeId:u('Sương').id, taskType:'R', completion:null, progress:0, taskGroup:'PHAT_SINH', department:'KN&DMST', stt:6, month:2, year:y2, createdById:admin.id },
      { taskId:'KN_DA_02_07', taskName:'Viết báo cáo chuyên đề Nghiên cứu mối liên kết giữa đại học – doanh nghiệp và cơ chế hợp tác giữa đại học – doanh nghiệp với Trung tâm Khởi nghiệp và Đổi mới sáng tạo TP Cần Thơ', startDate:d2(16), dueDate:d2(25,3), assigneeId:u('Sương').id, taskType:'R', completion:null, progress:0, taskGroup:'PHAT_SINH', department:'KN&DMST', stt:7, month:2, year:y2, createdById:admin.id },
    ]);

    console.log('✅ Seed data created successfully');
    console.log('');
    console.log('📋 TÀI KHOẢN ĐĂNG NHẬP:');
    console.log('─────────────────────────────────────────────────');
    console.log('👑 Admin      : admin@qlcv.vn      / Admin@2024');
    console.log('👑 GĐ Hải     : hai@qlcv.vn        / Hai@2024');
    console.log('🔑 PGĐ Khanh  : khanh@qlcv.vn      / Khanh@2024');
    console.log('🔑 PGĐ Điền   : dien@qlcv.vn       / Dien@2024');
    console.log('🔑 PGĐ Vụ     : vu@qlcv.vn         / Vu@2024');
    console.log('👤 Sương      : suong@qlcv.vn       / Suong@2024');
    console.log('👤 Như        : nhu@qlcv.vn         / Nhu@2024');
    console.log('👤 Hương      : huong@qlcv.vn       / Huong@2024');
    console.log('👤 Trà        : tra@qlcv.vn         / Tra@2024');
    console.log('👤 Tùng       : tung@qlcv.vn        / Tung@2024');
    console.log('👤 P.Anh      : panh@qlcv.vn        / Panh@2024');
    console.log('─────────────────────────────────────────────────');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seed();
