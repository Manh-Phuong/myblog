import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatISO9075 } from "date-fns";
import { UserContext } from "../UserContext";
import { Link } from "react-router-dom";

export default function PostPage() {
  const [commentContent, setCommentContent] = useState("");
  const [postInfo, setPostInfo] = useState(null);
  const { userInfo } = useContext(UserContext);
  const { id } = useParams();
  const [comments, setComments] = useState([]);
  const [rd, setRd] = useState(1);

  const [showGoTopButton, setShowGoTopButton] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:4000/post/${id}`).then((response) => {
      response.json().then((postInfo) => {
        setPostInfo(postInfo);
        // setComments(postInfo.comments);
      });
    });

    fetch(`http://localhost:4000/postcomments/${id}`)
      .then((response) => response.json())
      .then((cmt) => {
        console.log(cmt);
        setComments(cmt);
      });
  }, [comments.length, rd]);

  const handleCommentChange = (e) => {
    setCommentContent(e.target.value);
  };

  const handleCommentSubmit = () => {
    // Gọi API để gửi bình luận
    const commentData = {
      content: commentContent,
      post: id,
      author: userInfo.id, // Truyền userId từ thông tin người dùng hiện tại
    };

    fetch(`http://localhost:4000/comment/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commentData),
    })
      .then((response) => response.json())
      .then((comment) => {
        // Xử lý khi bình luận được tạo thành công
        console.log("Comment created:", comment);
        
        // Reset input bình luận
        setCommentContent("");
        // Cập nhật danh sách các comment
        setComments([...comments, comment]);
      })
      .catch((error) => {
        console.error("Error creating comment:", error);
      });
  };


  const handleDeleteCmt = (idCmt) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa bình luận này không?");
    if (confirmed) {
      fetch(`http://localhost:4000/deletecomment`, {
        method: "DELETE",
        headers: {'Content-Type':'application/json'},
        credentials: 'include',
        body: JSON.stringify({ idCmt: idCmt }),
      })
      .then((response) => {
        console.log(response);
        if (response.ok) {
          console.log("Comment deleted successfully");
          setRd((rd) => rd + 1);
          // TODO: update comment list
        } else {
          throw new Error("Failed to delete comment");
        }
      })
      .catch((error) => {
        console.error("Error deleting comment:", error);
      });
    }
  };
  

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowGoTopButton(true);
      } else {
        setShowGoTopButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleGoTopClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!postInfo) return "";

  return (
    <>
      <div className="post-page">
        <h1>{postInfo.title}</h1>
        <time>{formatISO9075(new Date(postInfo.createdAt))}</time>
        <div className="author">Tác giả: {postInfo.author.username}</div>
        {userInfo.id === postInfo.author._id && (
          <div className="edit-row">
            <Link className="edit-btn" to={`/edit/${postInfo._id}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              Sửa bài
            </Link>
          </div>
        )}
        <div className="image">
          <img src={`http://localhost:4000/${postInfo.cover}`} alt="" />
        </div>
        <div
          className="content"
          dangerouslySetInnerHTML={{ __html: postInfo.content }}
        />
      </div>

      {showGoTopButton && (
        <button
          className={`go-top-button ${showGoTopButton ? "show" : ""}`}
          onClick={handleGoTopClick}
        >
          <svg
            width="16"
            data-e2e=""
            height="16"
            viewBox="0 0 48 48"
            fill="#FFF"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M22.1086 20.3412C23.1028 19.2196 24.8972 19.2196 25.8914 20.3412L42.8955 39.5236C44.2806 41.0861 43.1324 43.5 41.004 43.5L6.99596 43.5C4.86764 43.5 3.71945 41.0861 5.10454 39.5235L22.1086 20.3412Z"
            ></path>
            <path d="M4.5 7.5C4.5 5.84315 5.84315 4.5 7.5 4.5L40.5 4.5C42.1569 4.5 43.5 5.84315 43.5 7.5C43.5 9.15685 42.1569 10.5 40.5 10.5L7.5 10.5C5.84315 10.5 4.5 9.15685 4.5 7.5Z"></path>
          </svg>
        </button>
      )}

      <div className="PostPage-comment">
        <h2>Bình luận</h2>
        <div>
          <input
            type="text"
            placeholder="Viết bình luận..."
            value={commentContent}
            onChange={handleCommentChange}
          />
          <button onClick={handleCommentSubmit}>Bình luận</button>
        </div>
        {/* Hiển thị danh sách các comment */}
        {comments.map(
          (comment) =>
            comment.author?.username &&
            comment?.content && (
              <div className="PostPage-comment-element" key={comment._id}>
                <div className="PostPage-comment-username">
                  <span className="PostPage-comment-name">{comment.author?.username}</span>
                  <div className="PostPage-comment-right">
                    <time className="PostPage-comment-time">{formatISO9075(new Date(comment?.createdAt))}</time>
                    {userInfo.id === postInfo.author._id && <div className="PostPage-comment-icon" onClick={() => handleDeleteCmt(comment._id)}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </div> }
                  </div>
                </div>
                <div className="PostPage-comment-content">
                  {comment?.content}
                </div>
              </div>
            )
        )}
      </div>
    </>
  );
}
