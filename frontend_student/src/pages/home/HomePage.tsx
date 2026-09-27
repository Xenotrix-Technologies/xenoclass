import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { courseService } from '../../services/courseService';
import { learningService } from '../../services/learningService';
import { R2_PUBLIC_URL } from '../../config/constants';
import {
  BookOpen,
  Clock,
  ChevronRight,
  ChevronLeft,
  Video,
  Play,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useStudentAuth();

  const [posters, setPosters] = useState<any[]>([]);
  const [activePosterIndex, setActivePosterIndex] = useState(0);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [popularCourses, setPopularCourses] = useState<any[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const studentName =
    user?.Student_Name ||
    user?.User_Name ||
    user?.First_Name ||
    user?.firstName ||
    'Learner';

  const getPosterImageUrl = (item: any) => {
    const path = item?.image_path || item?.image || item?.image_url || item?.Image_Url || '';
    if (!path) return '/assets/images/carosel_1.png';
    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('data:') ||
      path.startsWith('/assets/')
    ) {
      return path;
    }
    const cleanPath = path.replace(/^\/+/, '');
    const baseUrl = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL : `${R2_PUBLIC_URL}/`;
    return `${baseUrl}${cleanPath}`;
  };

  useEffect(() => {
    loadHomeDashboard();
  }, [user]);

  // Dynamic Auto-slide carousel
  useEffect(() => {
    if (posters.length <= 1) return;
    const timer = setInterval(() => {
      setActivePosterIndex((prev) => (prev + 1) % posters.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [posters.length]);

  const loadHomeDashboard = async () => {
    try {
      setLoading(true);
      const studentId = user?.Student_ID || user?.Id || user?.User_ID || 0;

      const [postersRes, popularRes, enrolledRes] = await Promise.all([
        courseService.getAppPosters().catch(() => []),
        courseService.searchCourses('').catch(() => []),
        studentId ? learningService.getMyEnrolledCourses(studentId).catch(() => []) : Promise.resolve([]),
      ]);

      const rawPosters = Array.isArray(postersRes) ? postersRes : [];
      const activePosters = rawPosters.filter(
        (p: any) => p.is_active === 1 || p.is_active === true || p.is_active === '1' || p.is_active === undefined
      );

      const posterList =
        activePosters.length > 0
          ? activePosters
          : [
              { id: 1, image: '/assets/images/carosel_1.png', title: 'Empower Your Learning' },
              { id: 2, image: '/assets/images/carosel_2.png', title: 'Interactive Masterclasses' },
              { id: 3, image: '/assets/images/carosel_3.png', title: 'Achieve Your Goals' },
            ];

      setPosters(posterList);
      setActivePosterIndex(0);

      const allCourses = Array.isArray(popularRes) ? popularRes : [];
      setPopularCourses(
        allCourses.length > 0
          ? allCourses
          : [
              {
                Course_ID: 1,
                Course_Name: 'IELTS Intensive Mastery',
                Price: '0.00',
                Description: 'Master Academic & General IELTS with daily interactive modules.',
                Lessons_Count: '30 Lessons',
                Duration: '20 Hrs',
                Image_Url: '/assets/images/banner_home_page.jpg.png',
              },
              {
                Course_ID: 2,
                Course_Name: 'OET Advanced Speaking & Roleplay',
                Price: '4999.00',
                Description: 'Clinical dialogue drills and healthcare communications.',
                Lessons_Count: '30 Lessons',
                Duration: '25 Hrs',
                Image_Url: '/assets/images/verification_img.jpg',
              },
              {
                Course_ID: 3,
                Course_Name: 'PTE Academic Fast-Track',
                Price: '3499.00',
                Description: 'Computer-delivered mock tests with AI score breakdown.',
                Lessons_Count: '30 Lessons',
                Duration: '18 Hrs',
                Image_Url: '/assets/images/carosel_2.png',
              },
            ]
      );

      setRecommendedCourses([
        {
          Course_ID: 4,
          Course_Name: 'Spoken English & Fluency Workshop',
          Price: '1999.00',
          Description: 'Accent neutralization, pronunciation rules & everyday dialogue practice.',
          Lessons_Count: '15 Lessons',
          Duration: '12 Hrs',
          Image_Url: '/assets/images/carosel_3.png',
        },
        {
          Course_ID: 5,
          Course_Name: 'Grammar Foundations for Professionals',
          Price: '0.00',
          Description: 'Tenses, sentence structures, active voice, and professional email writing.',
          Lessons_Count: '20 Lessons',
          Duration: '15 Hrs',
          Image_Url: '/assets/images/carosel_1.png',
        },
      ]);

      const enrolled = Array.isArray(enrolledRes) ? enrolledRes : [];
      setEnrolledCourses(
        enrolled.length > 0
          ? enrolled
          : [
              {
                Course_ID: 1,
                Course_Name: 'IELTS Intensive Mastery',
                Batch_Names: 'IELTS Morning Batch A',
                Progress: 45,
                Image_Url: '/assets/images/banner_home_page.jpg.png',
              },
            ]
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePosterClick = (poster: any) => {
    if (!poster?.link_url) return;
    const url = poster.link_url.trim();
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(url);
    }
  };

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (posters.length <= 1) return;
    setActivePosterIndex((prev) => (prev - 1 + posters.length) % posters.length);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (posters.length <= 1) return;
    setActivePosterIndex((prev) => (prev + 1) % posters.length);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif] max-w-5xl mx-auto pb-12">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HERO HEADER BANNER */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-2xl shadow-xs border border-[#E3E7EE] bg-white aspect-[3/1] w-full">
        <img
          src="/assets/images/banner_home_page.jpg.png"
          alt="Xeno Class - Your Digital Learning Hub"
          className="w-full h-full object-cover object-center"
          onError={(e: any) => {
            e.currentTarget.src = '/assets/images/xenoclass_banner.png';
          }}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. EXPLORE COURSES / FIND A MENTOR STACK (_buildExploreCoursesStack) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-[#E3E7EE] p-4 sm:p-5 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-[16px] font-bold text-[#283B52]">
            Find a mentor
          </h3>
          <p className="text-[12px] text-[#808B9A] font-medium">
            anywhere, anytime
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/faculty')}
          className="h-[34px] px-4 bg-gradient-to-r from-[#2B83D5] to-[#1863D3] hover:from-[#1863D3] hover:to-[#124FB0] text-white text-[12px] font-bold rounded-full shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
        >
          <img
            src="/assets/images/glitter.svg"
            alt=""
            className="w-3.5 h-3.5 object-contain"
            onError={(e: any) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span>Connect Now</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. PROMOTIONAL CAROUSEL (Dynamic Poster Carousel) */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-2">
        <div className="group relative overflow-hidden rounded-2xl h-[145px] sm:h-[175px] bg-[#1863D3]/5 border border-[#E3E7EE] shadow-xs select-none">
          {posters.map((p, idx) => {
            const hasLink = !!p.link_url && p.link_url.trim().length > 0;
            return (
              <div
                key={p.id || idx}
                onClick={() => hasLink && handlePosterClick(p)}
                className={`absolute inset-0 transition-opacity duration-700 flex items-center justify-center ${
                  activePosterIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                } ${hasLink ? 'cursor-pointer' : ''}`}
                title={p.title || 'Announcement Banner'}
              >
                <img
                  src={getPosterImageUrl(p)}
                  alt={p.title || 'Announcement'}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-101"
                  onError={(e: any) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `/assets/images/carosel_${(idx % 3) + 1}.png`;
                  }}
                />
              </div>
            );
          })}

          {/* Left Arrow Button */}
          {posters.length > 1 && (
            <button
              type="button"
              onClick={handlePrevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md cursor-pointer"
              aria-label="Previous Poster"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Right Arrow Button */}
          {posters.length > 1 && (
            <button
              type="button"
              onClick={handleNextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md cursor-pointer"
              aria-label="Next Poster"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Dynamic Dots Indicator */}
          {posters.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5 px-2 py-1 rounded-full bg-black/20 backdrop-blur-xs">
              {posters.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePosterIndex(i);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    activePosterIndex === i ? 'w-5 bg-[#1863D3]' : 'w-2 bg-white/70 hover:bg-white'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. ENROLLED COURSES (buildEnrolCourse with EnrolItemWidget) */}
      {/* ------------------------------------------------------------- */}
      {enrolledCourses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-[#283B52] tracking-tight">
              Enrolled Courses
            </h2>
            <Link
              to="/my-courses"
              className="text-[12px] font-bold text-[#1863D3] hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="flex space-x-4 overflow-x-auto pb-3 pt-1 scrollbar-thin">
            {enrolledCourses.map((c, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`/courses/${c.Course_ID || 1}`)}
                className="w-[230px] sm:w-[240px] shrink-0 bg-white rounded-xl border border-[#E3E7EE] p-3 shadow-xs hover:border-[#1863D3]/40 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Thumbnail */}
                  <div className="w-full h-[110px] rounded-lg bg-gray-100 overflow-hidden relative shadow-2xs">
                    <img
                      src={c.Image_Url || '/assets/images/banner_home_page.jpg.png'}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.currentTarget.src = '/assets/images/verification_img.jpg';
                      }}
                    />
                  </div>

                  <div>
                    <h3 className="text-[14px] font-bold text-[#111822] line-clamp-1">
                      {c.Course_Name}
                    </h3>
                    <p className="text-[11px] text-[#808B9A] font-medium mt-0.5">
                      {c.Batch_Names || 'Standard Cohort'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F4F7FA] mt-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#1863D3]">
                    30 Days Curriculum
                  </span>
                  <span className="text-[11px] font-bold text-[#1863D3] bg-[#E5F0FF] px-2.5 py-1 rounded-md">
                    Continue →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. POPULAR COURSES (_buildPopularCoursesColumn) */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-[#283B52] tracking-tight">
            Popular courses
          </h2>
          <Link
            to="/explore"
            className="text-[12px] font-bold text-[#1863D3] hover:underline"
          >
            See All
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {popularCourses.map((c) => (
            <div
              key={c.Course_ID}
              className="bg-white rounded-xl border border-[#E3E7EE] p-3.5 shadow-xs hover:border-[#1863D3]/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                <div className="w-full h-[120px] rounded-lg bg-gray-100 overflow-hidden relative shadow-2xs">
                  <img
                    src={c.Image_Url || '/assets/images/verification_img.jpg'}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      e.currentTarget.src = '/assets/images/banner_home_page.jpg.png';
                    }}
                  />
                  <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {c.Price === '0.00' || !c.Price ? 'Free' : `₹ ${c.Price}`}
                  </span>
                </div>

                <div>
                  <h3 className="text-[14px] font-bold text-[#111822] line-clamp-1">
                    {c.Course_Name}
                  </h3>
                  <p className="text-[11px] text-[#808B9A] line-clamp-2 mt-1">
                    {c.Description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F4F7FA] flex items-center justify-between">
                <div className="flex items-center space-x-2 text-[11px] text-[#808B9A] font-semibold">
                  <div className="flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#1863D3]" />
                    <span>{c.Lessons_Count || '30 Lessons'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-[#1863D3]" />
                    <span>{c.Duration || '20 Hrs'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/courses/${c.Course_ID}`)}
                  className="px-3 py-1.5 bg-[#1863D3] hover:bg-[#1A7AE8] text-white text-[11px] font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  Course Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. RECOMMENDED COURSES (_buildPopularCoursesColumn) */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-[#283B52] tracking-tight">
            Recommended courses
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recommendedCourses.map((c) => (
            <div
              key={c.Course_ID}
              className="bg-white rounded-xl border border-[#E3E7EE] p-3.5 shadow-xs hover:border-[#1863D3]/40 transition-all flex items-center justify-between space-x-3"
            >
              <div className="w-[100px] h-[75px] rounded-lg bg-gray-100 overflow-hidden shrink-0">
                <img
                  src={c.Image_Url || '/assets/images/carosel_1.png'}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-[13px] font-bold text-[#111822] truncate">
                  {c.Course_Name}
                </h4>
                <p className="text-[11px] text-[#808B9A] line-clamp-1 mt-0.5">
                  {c.Description}
                </p>
                <div className="flex items-center space-x-2 text-[10px] text-[#1863D3] font-bold mt-1">
                  <span>{c.Duration || '15 Hrs'}</span>
                  <span>•</span>
                  <span>{c.Price === '0.00' ? 'Free' : `₹ ${c.Price}`}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/courses/${c.Course_ID}`)}
                className="px-3 py-1.5 bg-[#E5F0FF] hover:bg-[#1863D3] text-[#1863D3] hover:text-white text-[11px] font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
