import { QuizQuestion, LessonVideo } from "@/types/student-quiz";

export const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "default-q1",
    question: "Thiết bị nào sau đây được dùng để nhập dữ liệu chữ và số vào máy tính?",
    options: [
      "Màn hình",
      "Bàn phím",
      "Loa",
      "Máy in"
    ],
    correctAnswer: 1, // Bàn phím
    explanation: "Bàn phím giúp chúng ta gõ các chữ cái, con số và ký hiệu để gửi thông tin vào máy tính."
  },
  {
    id: "default-q2",
    question: "Bộ phận nào được coi là 'bộ não' điều khiển mọi hoạt động của máy tính?",
    options: [
      "Thân máy (CPU)",
      "Chuột máy tính",
      "Màn hình",
      "Bàn phím"
    ],
    correctAnswer: 0, // Thân máy (CPU)
    explanation: "Thân máy chứa bộ vi xử lý (CPU), nơi xử lý thông tin và điều khiển mọi hoạt động của máy tính."
  },
  {
    id: "default-q3",
    question: "Khi muốn chọn một biểu tượng trên màn hình máy tính, em thường sử dụng thao tác nào?",
    options: [
      "Nháy đúp chuột",
      "Nháy nút phải chuột",
      "Nháy nút trái chuột",
      "Kéo thả chuột"
    ],
    correctAnswer: 2, // Nháy nút trái chuột
    explanation: "Nháy nút trái chuột một lần (nháy chuột) thường dùng để chọn một đối tượng trên màn hình."
  },
  {
    id: "default-q4",
    question: "Thiết bị nào sau đây dùng để đưa âm thanh từ máy tính ra ngoài để em nghe nhạc?",
    options: [
      "Loa",
      "Bàn phím",
      "Thân máy",
      "Chuột"
    ],
    correctAnswer: 0, // Loa
    explanation: "Loa là thiết bị đầu ra giúp phát ra âm thanh từ máy tính tới tai chúng ta."
  },
  {
    id: "default-q5",
    question: "Để tắt máy tính an toàn sau khi học xong, em nên thực hiện thao tác nào?",
    options: [
      "Rút trực tiếp dây cắm nguồn điện",
      "Nhấn giữ nút nguồn trên thân máy",
      "Sử dụng lệnh Shut down trong hệ điều hành",
      "Cứ để vậy và đi chơi"
    ],
    correctAnswer: 2, // Shut down
    explanation: "Chọn lệnh Shut down (hoặc Turn off) giúp hệ điều hành lưu lại các công việc và tắt máy tính an toàn, bảo vệ máy không bị hỏng."
  },
  {
    id: "default-q6",
    question: "Hành động nào sau đây là KHÔNG an toàn khi sử dụng máy tính?",
    options: [
      "Ngồi thẳng lưng, mắt cách màn hình từ 50-80cm",
      "Vừa ăn uống vừa sử dụng máy tính",
      "Giữ tay khô ráo khi cắm điện máy tính",
      "Nghỉ ngơi mắt sau mỗi 30 phút sử dụng máy"
    ],
    correctAnswer: 1, // Vừa ăn uống
    explanation: "Ăn uống gần máy tính dễ làm đổ nước hoặc thức ăn rơi vào bàn phím gây chập điện, hỏng thiết bị."
  },
  {
    id: "default-q7",
    question: "Thông tin trong máy tính được lưu trữ dưới dạng nào?",
    options: [
      "Tệp (File) và Thư mục (Folder)",
      "Chỉ lưu dạng chữ viết",
      "Chỉ lưu dạng hình ảnh",
      "Không lưu trữ được thông tin"
    ],
    correctAnswer: 0, // Tệp và Thư mục
    explanation: "Máy tính sắp xếp và quản lý thông tin bằng các tệp dữ liệu, được để gọn gàng trong các thư mục giống như các ngăn tủ."
  },
  {
    id: "default-q8",
    question: "Internet giúp ích gì cho học sinh lớp 4 trong học tập?",
    options: [
      "Chỉ dùng để chơi game cả ngày",
      "Tìm kiếm tài liệu học tập, xem video bài giảng lý thú",
      "Tự động làm hộ bài tập về nhà mà không cần suy nghĩ",
      "Xem các nội dung không phù hợp với lứa tuổi"
    ],
    correctAnswer: 1, // Tìm tài liệu
    explanation: "Internet là kho tàng kiến thức giúp em tìm kiếm bài đọc bổ ích, xem video bài giảng sinh động để học tốt hơn."
  },
  {
    id: "default-q9",
    question: "Khi gặp thông tin đáng sợ hoặc người lạ nhắn tin bắt chuyện trên Internet, em nên làm gì?",
    options: [
      "Tiếp tục trò chuyện và giữ bí mật",
      "Làm theo mọi yêu cầu của người lạ",
      "Tắt đi và kể ngay với bố mẹ hoặc thầy cô giáo",
      "Tự mình giải quyết không báo ai"
    ],
    correctAnswer: 2, // Tắt đi kể ngay
    explanation: "Khi gặp nội dung xấu hoặc người lạ liên lạc trên mạng, em cần thông báo cho người lớn để được bảo vệ kịp thời."
  },
  {
    id: "default-q10",
    question: "Khi gõ phím trên bàn phím, hai bàn tay của em nên đặt như thế nào?",
    options: [
      "Chỉ dùng một ngón tay trỏ để gõ tất cả các phím",
      "Đặt nhẹ hai tay lên hàng phím cơ sở, các ngón tay phụ trách các phím tương ứng",
      "Để tay bất kỳ đâu em thích",
      "Gõ thật mạnh bằng cả nắm đấm tay"
    ],
    correctAnswer: 1, // Hàng cơ sở
    explanation: "Đặt nhẹ tay lên hàng phím cơ sở giúp em gõ phím nhanh hơn, chính xác hơn bằng cả 10 ngón tay."
  }
];

export const STATIC_VIDEOS: LessonVideo[] = [
  {
    title: "Khám phá thế giới máy tính - Kiến thức tin học",
    description: "Bài học giúp học sinh làm quen với các bộ phận của máy tính và cách hoạt động cơ bản.",
    youtubeUrl: "https://www.youtube.com/embed/zH3vHkG4jhs"
  },
  {
    title: "Sử dụng bàn phím và chuột đúng cách",
    description: "Hướng dẫn chi tiết tư thế ngồi gõ phím, thao tác chuột chính xác và bảo vệ sức khoẻ.",
    youtubeUrl: "https://www.youtube.com/embed/0G6L36_yEwI"
  },
  {
    title: "An toàn khi sử dụng Internet cho học sinh tiểu học",
    description: "Những quy tắc vàng giúp em lướt web an toàn, phòng tránh kẻ xấu và thông tin độc hại.",
    youtubeUrl: "https://www.youtube.com/embed/O8Yl1w8u6v4"
  }
];
