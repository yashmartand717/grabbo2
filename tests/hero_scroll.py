"""Browser regression checks. Run Vite, then: python tests/hero_scroll.py

Requires Python Playwright and its Chromium browser.
"""
import os
import unittest
from playwright.sync_api import sync_playwright


class HeroScrollTests(unittest.TestCase):
    def setUp(self):
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch()
        self.page = self.browser.new_page(
            viewport={"width": 390, "height": 844},
            is_mobile=True, has_touch=True, device_scale_factor=2,
        )
        self.page.add_init_script("""
            const originalDraw = CanvasRenderingContext2D.prototype.drawImage;
            CanvasRenderingContext2D.prototype.drawImage = function(image, ...rect) {
                if (this.canvas.id === 'bg-canvas') {
                    window.heroDraw = {src: image.src, rect};
                }
                return originalDraw.call(this, image, ...rect);
            };
        """)
        self.page.goto(os.environ.get("BASE_URL", "http://127.0.0.1:5173/"))
        self.page.wait_for_function("window.heroDraw")
        # Keep the fixture's scroll offsets fixed while unrelated lazy images load.
        self.page.add_style_tag(content="html { overflow-anchor: none; }")

    def tearDown(self):
        self.browser.close()
        self.playwright.stop()

    def scroll(self, y, expected_frame=None):
        self.page.evaluate("y => window.scrollTo(0, y)", y)
        if expected_frame:
            # Wait for the requested asset, rather than sampling a nearby fallback
            # while Chromium is still downloading/decoding the frame.
            self.page.wait_for_function(
                "name => window.heroDraw.src.endsWith(name)", arg=expected_frame)
        else:
            self.page.wait_for_timeout(300)
        return self.page.evaluate("window.heroDraw")

    def test_first_small_swipe_advances_the_sequence(self):
        initial = self.scroll(0)
        moved = self.scroll(10)
        self.assertNotEqual(initial["src"], moved["src"], "First swipe still shows frame 1")
        self.assertGreater(moved["rect"][2] - initial["rect"][2], 5,
                           "Zoom has an imperceptibly slow start")

    def test_mobile_hero_copy_and_button_stay_on_the_store_image(self):
        self.page.wait_for_timeout(1800)  # Finish the existing entrance animations.
        image = self.page.evaluate("window.heroDraw.rect")
        title = self.page.locator('.hero-brand-title').bounding_box()
        button = self.page.locator('.explore-btn').bounding_box()
        self.assertGreaterEqual(title['y'], image[1])
        self.assertLessEqual(button['y'] + button['height'], image[1] + image[3],
                             'Hero button sits in artificial fill below the photo')

    def test_content_loading_does_not_retime_mobile_animation(self):
        initial = self.scroll(400, "frame-036.webp")
        self.page.evaluate("""() => {
            const content = document.createElement('div');
            content.style.height = '10000px';
            document.body.append(content);
        }""")
        self.scroll(410)
        after = self.scroll(400)
        self.assertEqual(initial["src"], after["src"])
        self.assertEqual(initial["rect"], after["rect"])

    def test_reverse_scroll_restores_starting_view(self):
        initial = self.scroll(0)
        moved = self.scroll(844)
        self.assertNotEqual(initial["src"], moved["src"])
        self.assertEqual(initial, self.scroll(0))

    def test_about_deep_link_opens_philosophy_between_vision_and_mission(self):
        errors = []
        self.page.on('pageerror', lambda error: errors.append(str(error)))
        self.page.goto(os.environ.get('BASE_URL', 'http://127.0.0.1:5173/').rstrip('/') + '/about')
        section = self.page.locator('#section-our-philosophy')
        section.wait_for(state='visible')
        headings = self.page.locator('#about-view .about-panel-title').all_text_contents()
        self.assertEqual(headings.index('Our Vision') + 1, headings.index('Our Philosophy'))
        self.assertEqual(headings.index('Our Philosophy') + 1, headings.index('Our Mission'))
        self.assertEqual(section.locator('.philosophy-principle').count(), 4)
        photo = section.locator('.philosophy-photo img')
        photo.scroll_into_view_if_needed()
        self.page.wait_for_function("""() => {
            const image = document.querySelector('.philosophy-photo img');
            return image && image.complete && image.naturalWidth > 0;
        }""")
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
