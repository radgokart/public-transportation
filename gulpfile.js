var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var uglify = require('gulp-uglify');
var pump = require('pump');
var cleanCSS = require('gulp-clean-css');
var htmlmin = require('gulp-htmlmin');

var ugly_options = {
    mangle: false,
    compress: false
};

gulp.task('default', function() {
  console.log("hello world!");
});

gulp.task('styles', function() {
    gulp.src('sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer('last 2 versions'))
    .pipe(gulp.dest('./src/css'));
});


gulp.task('compressjs', function (cb) {
  pump([
        gulp.src('src/**/*.js'),
        uglify(ugly_options),
        gulp.dest('./dist')
    ],
    cb
  );
});

gulp.task('minify-css', function() {
  return gulp.src('src/css/*.css')
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(gulp.dest('dist/css'));
});

gulp.task('minify-html', function() {
  return gulp.src('src/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'));
});
