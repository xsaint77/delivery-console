import TestComponent from 'console/components/recipes/RevisionNotice';

const { WrappedComponent: RevisionNotice } = TestComponent;

describe('<RevisionNotice>', () => {
  const props = {
    enabled: false,
    isPendingApproval: false,
    status: null,
  };

  it('should work', () => {
    const wrapper = () => shallow(<RevisionNotice {...props} />);

    expect(wrapper).not.toThrow();
  });
});
