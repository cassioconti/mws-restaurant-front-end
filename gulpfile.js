/*eslint-env node */

var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('gulp-browserify');
var clean = require('gulp-clean');

gulp.task('default', ['copy-html', 'copy-images', 'styles', 'scripts-dist'], function () {});

gulp.task('dist', [
    'copy-html',
    'copy-images',
    'styles',
    'scripts-dist'
]);

gulp.task('clean', () => {
    return gulp.src('./dist')
        .pipe(clean());
});

gulp.task('scripts-dist', function () {
    gulp.src('./service-worker.js')
        .pipe(browserify())
        .pipe(gulp.dest('./dist/'))
    gulp.src('./js/main.js')
        .pipe(sourcemaps.init())
        .pipe(browserify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./dist/js'));
    gulp.src('./js/restaurant_info.js')
        .pipe(sourcemaps.init())
        .pipe(browserify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('copy-html', function () {
    gulp.src('./*.html')
        .pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function () {
    gulp.src('img/*')
        .pipe(gulp.dest('dist/img'));
});

gulp.task('styles', function () {
    gulp.src('css/*')
        .pipe(gulp.dest('dist/css'));
});