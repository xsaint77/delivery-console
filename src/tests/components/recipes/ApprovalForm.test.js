import { Map } from 'immutable';
import TestComponent from 'console/components/recipes/ApprovalForm';

const { WrappedComponent: ApprovalForm } = TestComponent;

describe('<ApprovalForm>', () => {
  const props = {
    approvalRequest: new Map(),
    closeApprovalRequest: () => {},
    form: {},
    onSubmit: () => {},
  };

  it('should work', () => {
    const wrapper = () => shallow(<ApprovalForm {...props} />);

    expect(wrapper).not.toThrow();
  });
});
