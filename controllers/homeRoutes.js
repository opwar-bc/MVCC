const router = require('express').Router();

const { Post, User, Comment } = require('../models');
const withAuth = require('../utils/auth');
const path = require('path');

router.get('/', async (req, res) => {
  try {
    const postData = await Post.findAll({
      include: [
        {
          model: User,
          attributes: ['username'],
        },
      ],
    });

    const posts = postData.map((post) => post.get({ plain: true }));

    const logged_in = await req.session.logged_in;
    
    res.render('home', { 
      posts, 
      logged_in,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/post/:id', async (req, res) => {
  try {
    const postData = await Post.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['username'],
        },
        {
          model: Comment,
          include: [
            {
              model: User,
              attributes: ['username'],
            },
          ],
        },
      ],
    });
    const post = postData.get({ plain: true });
    const logged_in = await req.session.logged_in;

    res.render('single-post', {
      post,
      logged_in,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/dashboard', withAuth, async (req, res) => {
  try {
    const postData = await Post.findAll({
      where: {
        user_id: req.session.user_id
      },
    });

    const posts = postData.map((post) => post.get({ plain: true }));
    const userData = await User.findByPk(req.session.user_id);
    const username = userData.get({ plain: true }).username;

    res.render('dashboard', { posts, logged_in: true, username });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/login', (req, res) => {
  if (req.session.logged_in) {
    res.redirect('/dashboard');
    return;
  }

  res.render('login');
});

router.get('/signup', function (req, res) {
  res.render(path.join(__dirname, '../views/signup.handlebars'));
});

router.get('/latest-user', async (req, res) => {
  try {
    const latestUser = await User.findOne({
      order: [['createdAt', 'DESC']],
    });

    res.json(latestUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/new-post', withAuth, (req, res) => {
  
  if (!req.session.logged_in) {
    res.redirect('/login');
    return;
  }

  res.render('new-post', {logged_in: true});
});

router.get('likes/:id', async (req, res) => {
  try {
    const postData = await Post.findByPk(req.params.id);

    if (!postData) {
      res.status(404).json({ message: 'No post found with this id!' });
      return;
    }

    const post = postData.get({ plain: true });

    res.render('likes', { post, logged_in: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
