const Evaluation = require('../models/Evaluation');

// @desc    Get all evaluations
// @route   GET /api/evaluations
// @access  Private
exports.getEvaluations = async (req, res) => {
  try {
    const filter = req.query.employeeId ? { employeeId: req.query.employeeId } : {};
    const evaluations = await Evaluation.find(filter)
      .populate('employeeId', 'name email')
      .populate('evaluatedBy', 'name email')
      .sort('-date');
    res.json({ success: true, data: evaluations });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single evaluation
// @route   GET /api/evaluations/:id
// @access  Private
exports.getEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('employeeId', 'name email')
      .populate('evaluatedBy', 'name email');
    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluation not found' });
    }
    res.json({ success: true, data: evaluation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create evaluation
// @route   POST /api/evaluations
// @access  Private/Admin
exports.createEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.create({
      ...req.body,
      evaluatedBy: req.user.id
    });
    res.status(201).json({ success: true, data: evaluation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update evaluation
// @route   PUT /api/evaluations/:id
// @access  Private/Admin
exports.updateEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluation not found' });
    }
    res.json({ success: true, data: evaluation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete evaluation
// @route   DELETE /api/evaluations/:id
// @access  Private/Admin
exports.deleteEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findByIdAndDelete(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluation not found' });
    }
    res.json({ success: true, message: 'Evaluation deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
