/*eslint-env node */

const gulp = require('gulp');
const browserify = require('gulp-browserify');
const clean = require('gulp-clean');
const resizer = require('gulp-images-resizer');
const minify = require('gulp-minify');
const imagemin = require('gulp-imagemin');
const webp = require('imagemin-webp');
const extReplace = require('gulp-ext-replace');
const inlineSource = require('gulp-inline-source');

gulp.task('default', ['copy-html', 'copy-images', 'styles', 'scripts-dist'], function () {});

gulp.task('dist', [
    'copy-html',
    'copy-images',
    'styles',
    'scripts-dist'
]);

gulp.task('clean', () => {
    return gulp.src('dist')
        .pipe(clean());
});

gulp.task('scripts-dist', function () {
    gulp.src('service-worker.js')
        .pipe(browserify())
        .pipe(minify())
        .pipe(gulp.dest('dist/'));
    gulp.src('js/main.js')
        .pipe(browserify())
        .pipe(minify())
        .pipe(gulp.dest('dist/js'));
    gulp.src('js/restaurant_info.js')
        .pipe(browserify())
        .pipe(minify())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('copy-html', function () {
    gulp.src('*.html')
        .pipe(inlineSource())
        .pipe(minify())
        .pipe(gulp.dest('dist'));
    gulp.src('manifest.json')
        .pipe(minify())
        .pipe(gulp.dest('dist'));
});

gulp.task('copy-images', function () {
    gulp.src('img/*')
        .pipe(gulp.dest('dist/img'));
    gulp.src('favicon.ico')
        .pipe(gulp.dest('dist'));
});

gulp.task('styles', function () {
    gulp.src('css/*')
        .pipe(minify())
        .pipe(gulp.dest('dist/css'));
    gulp.src('node_modules/toastr/build/toastr.min.css')
        .pipe(minify())
        .pipe(gulp.dest('dist/css'));
});

gulp.task('resize', function () {
    return gulp.src(['img/1.jpg', 'img/2.jpg', 'img/3.jpg', 'img/4.jpg', 'img/5.jpg', 'img/6.jpg', 'img/7.jpg', 'img/8.jpg', 'img/9.jpg', 'img/no-image.jpg'])
        .pipe(resizer({
            width: 270,
            format: 'jpg',
            // tinify: true
        }))
        .pipe(gulp.dest('dest/'));
});

gulp.task('convert2webp', function () {
    // return gulp.src(['img/1.jpg', 'img/2.jpg', 'img/3.jpg', 'img/4.jpg', 'img/5.jpg', 'img/6.jpg', 'img/7.jpg', 'img/8.jpg', 'img/9.jpg', 'img/no-image.jpg'])
    return gulp.src(['img/large1.jpg', 'img/large2.jpg', 'img/large3.jpg', 'img/large4.jpg', 'img/large5.jpg', 'img/large6.jpg', 'img/large7.jpg', 'img/large8.jpg', 'img/large9.jpg', 'img/largeno-image.jpg'])
        .pipe(imagemin([webp({
            quality: 75
        })]))
        .pipe(extReplace('.webp'))
        .pipe(gulp.dest('dest/'));
});